# Database Schema Baseline & ER Diagram
**Shared Task Lead**: Student 2 (Resource, Shelter & Inventory Management)

## Overview
This document specifies the PostgreSQL database schema baseline and Entity-Relationship (ER) model for the Emergency Resource Coordination Platform (ERCP). It highlights Student 2's ownership slice (**Resources**, **Shelters**, **InventoryItems**, and **SituationAssessments**) and shows how all components integrate.

## Mermaid ER Diagram

```mermaid
erDiagram
    VOLUNTEER {
        uuid Id PK
        string Name
        string Email
        string Phone
        string Skills
        boolean IsAvailable
        datetime CreatedAt
    }

    SHIFT {
        int Id PK
        uuid VolunteerId FK
        datetime StartTime
        datetime EndTime
        string Status
    }

    DISPATCH {
        int Id PK
        int IncidentId FK
        string Priority
        string Status
        datetime CreatedAt
        datetime UpdatedAt
        datetime ApprovedAt
        string ApprovedBy
    }

    DISPATCH_TASK {
        int Id PK
        int DispatchId FK
        uuid VolunteerId FK
        int ResourceId FK
        string TaskType
        string Status
        datetime AssignedAt
    }

    INCIDENT {
        int Id PK
        string Title
        string Description
        string Location
        string Status
        string Priority
        datetime CreatedAt
        datetime UpdatedAt
    }

    SHELTER {
        int Id PK
        string Name
        string Location
        string Address
        int TotalCapacity
        int CurrentOccupancy
        string Status
        string ContactNumber
        double Latitude
        double Longitude
        datetime CreatedAt
        datetime UpdatedAt
    }

    RESOURCE {
        int Id PK
        string Name
        string ResourceType
        string Status
        int Capacity
        string Location
        int ShelterId FK
        datetime CreatedAt
        datetime UpdatedAt
    }

    INVENTORY_ITEM {
        int Id PK
        string ItemName
        string Category
        int Quantity
        string UnitOfMeasure
        int MinimumThreshold
        int ShelterId FK
        string Location
        string Status
        datetime CreatedAt
        datetime UpdatedAt
    }

    SITUATION_ASSESSMENT {
        int Id PK
        int IncidentId FK
        int UrgencyScore
        string UrgencyLevel
        string AnalysisSummary
        string RecommendedResourceTypes
        int NearestShelterId FK
        string ResourceDeficiencyJson
        datetime CreatedAt
    }

    VOLUNTEER ||--o{ SHIFT : "has"
    VOLUNTEER ||--o{ DISPATCH_TASK : "assigned to"
    DISPATCH ||--o{ DISPATCH_TASK : "contains"
    SHELTER ||--o{ RESOURCE : "houses"
    SHELTER ||--o{ INVENTORY_ITEM : "stores"
    INCIDENT ||--o{ SITUATION_ASSESSMENT : "analyzed by"
```

## Entities Owned by Student 2
1. **Shelters**: Tracks physical evacuation facilities, contact details, total capacity, current occupancy, and operational status (`Active`, `Full`, `Inactive`).
2. **Resources**: Tracks emergency vehicles, generators, trauma kits, and machinery. Includes real-time availability status (`Available`, `Dispatched`, `Maintenance`, `Reserved`) and location links to shelters.
3. **InventoryItems**: Tracks medical supplies, rations, water, and power equipment. Enforces automated low-stock detection (`InStock`, `LowStock`, `OutOfStock`) based on `MinimumThreshold`.
4. **SituationAssessments**: Stores the structured output and workflow audit trace produced by the **Situation Analysis AI Agent**.

## Audit & Integrity Constraints
- Audit fields (`CreatedAt`, `UpdatedAt`) maintained on all tables.
- Foreign Key constraints with `ON DELETE SET NULL` for shelter-resource/inventory relationships to prevent cascading loss of physical assets upon shelter status changes.
