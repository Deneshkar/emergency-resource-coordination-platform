# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["ERCP.Api.csproj", "./"]
RUN dotnet restore "ERCP.Api.csproj"

COPY . .
RUN dotnet publish "ERCP.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://0.0.0.0:8000
EXPOSE 8000

ENTRYPOINT ["dotnet", "ERCP.Api.dll"]
