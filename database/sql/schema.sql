USE IncidentManagementDB;
GO

/* =========================================================
   INCIDENT NUMBER SEQUENCE
   Generates: 1001, 1002, 1003...
   Used to create: INC-1001, INC-1002, INC-1003...
   ========================================================= */

CREATE SEQUENCE dbo.IncidentNumberSequence
    AS INT
    START WITH 1001
    INCREMENT BY 1;
GO


/* =========================================================
   USERS
   ========================================================= */

CREATE TABLE dbo.Users
(
    Id INT IDENTITY(1,1) NOT NULL
        CONSTRAINT PK_Users PRIMARY KEY,

    Name NVARCHAR(100) NOT NULL,

    Email NVARCHAR(255) NOT NULL
        CONSTRAINT UQ_Users_Email UNIQUE,

    PasswordHash NVARCHAR(255) NOT NULL,

    Role NVARCHAR(20) NOT NULL
        CONSTRAINT CK_Users_Role
        CHECK (Role IN ('ADMIN', 'AGENT')),

    IsActive BIT NOT NULL
        CONSTRAINT DF_Users_IsActive DEFAULT 1,

    CreatedAt DATETIME2(3) NOT NULL
        CONSTRAINT DF_Users_CreatedAt DEFAULT SYSUTCDATETIME()
);
GO


/* =========================================================
   INCIDENTS
   ========================================================= */

CREATE TABLE dbo.Incidents
(
    Id INT IDENTITY(1,1) NOT NULL
        CONSTRAINT PK_Incidents PRIMARY KEY,

    IncidentNumber NVARCHAR(20) NOT NULL
        CONSTRAINT UQ_Incidents_IncidentNumber UNIQUE,

    Title NVARCHAR(200) NOT NULL,

    Description NVARCHAR(MAX) NOT NULL,

    Priority NVARCHAR(10) NOT NULL
        CONSTRAINT CK_Incidents_Priority
        CHECK (Priority IN ('P1', 'P2', 'P3', 'P4')),

    Category NVARCHAR(50) NOT NULL
        CONSTRAINT CK_Incidents_Category
        CHECK
        (
            Category IN
            (
                'APPLICATION',
                'DATABASE',
                'NETWORK',
                'SECURITY',
                'INFRASTRUCTURE',
                'AUTHENTICATION',
                'OTHER'
            )
        ),

    Status NVARCHAR(30) NOT NULL
        CONSTRAINT CK_Incidents_Status
        CHECK
        (
            Status IN
            (
                'OPEN',
                'IN_PROGRESS',
                'RESOLVED',
                'CLOSED',
                'REOPENED'
            )
        ),

    CreatedBy INT NOT NULL,

    AssignedTo INT NULL,

    CreatedAt DATETIME2(3) NOT NULL
        CONSTRAINT DF_Incidents_CreatedAt DEFAULT SYSUTCDATETIME(),

    UpdatedAt DATETIME2(3) NOT NULL
        CONSTRAINT DF_Incidents_UpdatedAt DEFAULT SYSUTCDATETIME(),

    ResolvedAt DATETIME2(3) NULL,

    CONSTRAINT FK_Incidents_CreatedBy
        FOREIGN KEY (CreatedBy)
        REFERENCES dbo.Users(Id),

    CONSTRAINT FK_Incidents_AssignedTo
        FOREIGN KEY (AssignedTo)
        REFERENCES dbo.Users(Id)
);
GO


/* =========================================================
   COMMENTS
   ========================================================= */

CREATE TABLE dbo.Comments
(
    Id INT IDENTITY(1,1) NOT NULL
        CONSTRAINT PK_Comments PRIMARY KEY,

    IncidentId INT NOT NULL,

    UserId INT NOT NULL,

    CommentText NVARCHAR(MAX) NOT NULL,

    CreatedAt DATETIME2(3) NOT NULL
        CONSTRAINT DF_Comments_CreatedAt DEFAULT SYSUTCDATETIME(),

    CONSTRAINT FK_Comments_Incident
        FOREIGN KEY (IncidentId)
        REFERENCES dbo.Incidents(Id)
        ON DELETE CASCADE,

    CONSTRAINT FK_Comments_User
        FOREIGN KEY (UserId)
        REFERENCES dbo.Users(Id)
);
GO


/* =========================================================
   KNOWLEDGE ARTICLES
   ========================================================= */

CREATE TABLE dbo.KnowledgeArticles
(
    Id INT IDENTITY(1,1) NOT NULL
        CONSTRAINT PK_KnowledgeArticles PRIMARY KEY,

    Title NVARCHAR(200) NOT NULL,

    Content NVARCHAR(MAX) NOT NULL,

    Category NVARCHAR(50) NOT NULL
        CONSTRAINT CK_KnowledgeArticles_Category
        CHECK
        (
            Category IN
            (
                'APPLICATION',
                'DATABASE',
                'NETWORK',
                'SECURITY',
                'INFRASTRUCTURE',
                'AUTHENTICATION',
                'OTHER'
            )
        ),

    CreatedBy INT NOT NULL,

    CreatedAt DATETIME2(3) NOT NULL
        CONSTRAINT DF_KnowledgeArticles_CreatedAt DEFAULT SYSUTCDATETIME(),

    UpdatedAt DATETIME2(3) NOT NULL
        CONSTRAINT DF_KnowledgeArticles_UpdatedAt DEFAULT SYSUTCDATETIME(),

    CONSTRAINT FK_KnowledgeArticles_CreatedBy
        FOREIGN KEY (CreatedBy)
        REFERENCES dbo.Users(Id)
);
GO


/* =========================================================
   INDEXES
   ========================================================= */

CREATE INDEX IX_Incidents_Status
    ON dbo.Incidents(Status);
GO

CREATE INDEX IX_Incidents_Priority
    ON dbo.Incidents(Priority);
GO

CREATE INDEX IX_Incidents_AssignedTo
    ON dbo.Incidents(AssignedTo);
GO

CREATE INDEX IX_Incidents_CreatedBy
    ON dbo.Incidents(CreatedBy);
GO

CREATE INDEX IX_Comments_IncidentId
    ON dbo.Comments(IncidentId);
GO

CREATE INDEX IX_KnowledgeArticles_Category
    ON dbo.KnowledgeArticles(Category);
GO