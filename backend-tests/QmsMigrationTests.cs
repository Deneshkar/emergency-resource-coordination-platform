using ERCP.Api.Data;
using ERCP.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql;
using Xunit;

namespace ERCP.Api.Tests;

public class MigrationFactAttribute : FactAttribute
{
    public MigrationFactAttribute()
    {
        if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("QMS_MIGRATION_ADMIN")))
            Skip = "Set QMS_MIGRATION_ADMIN to the isolated localhost PostgreSQL admin connection.";
    }
}

public class QmsMigrationTests
{
    private const string ResourceMigration = "20260910131851_AddResourceAndShelterManagement";
    private const string IncidentMigration = "20260916110602_AddAffectedCountToIncidents";
    private const string PreviousMigration = "20260823065230_AddIncidentManagement";

    // Each test owns unique databases. No shared/application database is reset.
    private sealed class TestDatabase : IAsyncDisposable
    {
        private readonly string admin;
        private readonly string name;
        public AppDbContext Db { get; }
        private TestDatabase(string admin, string name, string connection)
        {
            this.admin = admin; this.name = name;
            Db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseNpgsql(connection).Options);
        }
        public static async Task<TestDatabase> Create()
        {
            var config = new NpgsqlConnectionStringBuilder(Environment.GetEnvironmentVariable("QMS_MIGRATION_ADMIN"));
            if (config.Host is not ("127.0.0.1" or "localhost") || config.Database != "postgres")
                throw new InvalidOperationException("Migration tests require a localhost postgres administrative database.");
            var admin = config.ConnectionString;
            var name = "qms_migration_" + Guid.NewGuid().ToString("N");
            await using var connection = new NpgsqlConnection(admin);
            await connection.OpenAsync();
            await using var command = new NpgsqlCommand($"CREATE DATABASE \"{name}\"", connection);
            await command.ExecuteNonQueryAsync();
            config.Database = name;
            return new TestDatabase(admin, name, config.ConnectionString);
        }
        public async ValueTask DisposeAsync()
        {
            await Db.DisposeAsync();
            // Only delete the exact random database created by this fixture.
            if (!System.Text.RegularExpressions.Regex.IsMatch(name, "^qms_migration_[a-f0-9]{32}$"))
                throw new InvalidOperationException("Unexpected test database name.");
            await using var connection = new NpgsqlConnection(admin);
            await connection.OpenAsync();
            await using var command = new NpgsqlCommand($"DROP DATABASE \"{name}\" WITH (FORCE)", connection);
            await command.ExecuteNonQueryAsync();
        }
    }

    private static async Task<string[]> Schema(AppDbContext db)
    {
        // Compare columns, lengths, nullability, foreign keys, primary keys and indexes.
        // Defaults used to backfill added columns need not match a fresh EnsureCreated schema.
        var rows = new List<string>();
        await db.Database.OpenConnectionAsync();
        await using var command = db.Database.GetDbConnection().CreateCommand();
        command.CommandText = """
            SELECT 'column|' || table_name || '|' || column_name || '|' || udt_name || '|' || is_nullable || '|' || coalesce(character_maximum_length::text, '') AS value
            FROM information_schema.columns WHERE table_schema = 'public' AND table_name <> '__EFMigrationsHistory'
            UNION ALL
            SELECT 'constraint|' || t.relname || '|' || c.conname || '|' || pg_get_constraintdef(c.oid)
            FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid=t.relnamespace
            WHERE n.nspname='public' AND t.relname <> '__EFMigrationsHistory'
            UNION ALL
            SELECT 'index|' || tablename || '|' || indexdef FROM pg_indexes
            WHERE schemaname='public' AND tablename <> '__EFMigrationsHistory'
            ORDER BY value;
            """;
        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync()) rows.Add(reader.GetString(0));
        return rows.ToArray();
    }

    [MigrationFact]
    public async Task MIG01_CleanMigration_MatchesCurrentModelSchema()
    {
        await using var migrated = await TestDatabase.Create();
        await migrated.Db.Database.MigrateAsync();
        Assert.Empty(await migrated.Db.Database.GetPendingMigrationsAsync());
        Assert.False(migrated.Db.Database.HasPendingModelChanges());
        await using var expected = await TestDatabase.Create();
        await expected.Db.Database.EnsureCreatedAsync();
        Assert.Equal(await Schema(expected.Db), await Schema(migrated.Db));
    }

    [MigrationFact]
    public async Task MIG02_IncidentMigration_RollbackPreservesResourceData()
    {
        await using var test = await TestDatabase.Create();
        var migrator = test.Db.GetService<IMigrator>();
        await migrator.MigrateAsync(ResourceMigration);
        var shelter = new Shelter { Name = "Migration Shelter", TotalCapacity = 10 };
        test.Db.Shelters.Add(shelter); await test.Db.SaveChangesAsync();
        test.Db.Resources.Add(new Resource { Name = "Keep Resource", ShelterId = shelter.Id });
        test.Db.InventoryItems.Add(new InventoryItem { ItemName = "Keep Inventory", ShelterId = shelter.Id });
        await test.Db.SaveChangesAsync();
        var before = await Schema(test.Db);
        await migrator.MigrateAsync(IncidentMigration);
        await migrator.MigrateAsync(ResourceMigration);
        Assert.Equal(before, await Schema(test.Db));
        test.Db.ChangeTracker.Clear();
        Assert.Equal("Migration Shelter", (await test.Db.Shelters.SingleAsync()).Name);
        Assert.Equal(shelter.Id, (await test.Db.Resources.SingleAsync()).ShelterId);
        Assert.Equal(shelter.Id, (await test.Db.InventoryItems.SingleAsync()).ShelterId);
        await migrator.MigrateAsync();
        Assert.Equal(1, await test.Db.Resources.CountAsync());
        Assert.Equal(1, await test.Db.InventoryItems.CountAsync());
    }

    [MigrationFact]
    public async Task MIG03_ResourceRollback_PreservesEarlierIncidentTablesAndData()
    {
        await using var test = await TestDatabase.Create();
        var migrator = test.Db.GetService<IMigrator>();
        await migrator.MigrateAsync(PreviousMigration);
        await test.Db.Database.ExecuteSqlRawAsync("""
            INSERT INTO "Incidents" ("Title","Description","Location","Status","Priority","CreatedAt","UpdatedAt")
            VALUES ('Preserved incident','Sample data','Colombo','Reported','High',NOW(),NOW());
            INSERT INTO "IncidentPlans" ("IncidentId","PlanTitle","PlanDescription","Status","CreatedAt")
            SELECT "Id",'Preserved plan','Plan description','Draft',NOW() FROM "Incidents";
            """);
        var before = await Schema(test.Db);
        await migrator.MigrateAsync(ResourceMigration);
        await migrator.MigrateAsync(PreviousMigration);
        Assert.Equal(before, await Schema(test.Db));
        await migrator.MigrateAsync();
        Assert.Equal("Preserved incident", (await test.Db.Incidents.SingleAsync()).Title);
        Assert.Equal("Preserved plan", (await test.Db.IncidentPlans.SingleAsync()).PlanTitle);
    }

    [MigrationFact]
    public async Task MIG04_ReapplyAndFullRollback_AreConsistent()
    {
        await using var test = await TestDatabase.Create();
        var migrator = test.Db.GetService<IMigrator>();
        await migrator.MigrateAsync();
        test.Db.Users.Add(new User { FullName = "Migration User", Email = "migration@test.local", PasswordHash = "fixture" });
        await test.Db.SaveChangesAsync();
        await migrator.MigrateAsync();
        test.Db.ChangeTracker.Clear();
        Assert.Equal("migration@test.local", (await test.Db.Users.SingleAsync()).Email);
        // The database is disposable and explicitly owned by this fixture.
        await migrator.MigrateAsync("0");
        Assert.Empty(await test.Db.Database.GetAppliedMigrationsAsync());
        Assert.Empty(await Schema(test.Db));
        await migrator.MigrateAsync();
        Assert.Empty(await test.Db.Database.GetPendingMigrationsAsync());
        Assert.False(await test.Db.Users.AnyAsync());
    }
}
