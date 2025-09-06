# Campus Event Management System - Scale Assumptions & Architecture

## Overview
This document analyzes the architectural decisions for a multi-college Campus Event Management System based on the specified scale requirements and addresses key design considerations for data organization and scalability.

## Scale Requirements

### 📊 System Scale Analysis

**Target Scale:**
- **50 colleges** in the system
- **500 students** per college (25,000 total students)
- **20 events** per semester per college (1,000 events per semester)
- **2 semesters** per year (2,000 events annually)

**Derived Metrics:**
```
Total Users: 25,000 students + ~150 admins (3 per college) = 25,150 users
Peak Registrations: ~10,000 registrations per event (assuming 40% participation)
Total Registrations per Semester: ~400,000 registrations
Annual Data Growth: ~800,000 registrations + ~320,000 attendance records
```

**Peak Load Scenarios:**
- **Registration Rush**: 500 students registering simultaneously for popular events
- **Event Day**: 500 students checking in within 1-hour window
- **Semester Start**: Multiple colleges creating events simultaneously

---

## Event ID Uniqueness Strategy

### 🔑 Option 1: Global Unique Event IDs (Recommended)

**Implementation:**
```sql
-- Single events table with globally unique IDs
CREATE TABLE events (
    id BIGSERIAL PRIMARY KEY,  -- Global unique ID
    college_id INTEGER NOT NULL REFERENCES colleges(id),
    title VARCHAR(255) NOT NULL,
    -- ... other fields
    UNIQUE(id)  -- Globally unique across all colleges
);
```

**Advantages:**
- ✅ **Simplicity**: Single source of truth for event identification
- ✅ **Cross-College Features**: Easy to implement inter-college events
- ✅ **API Consistency**: Single event endpoint `/events/{id}`
- ✅ **Analytics**: Simplified cross-college reporting and comparisons
- ✅ **Data Integrity**: No ID collision risks
- ✅ **Future-Proof**: Supports system expansion and mergers

**Disadvantages:**
- ❌ **Sequential Disclosure**: Event IDs reveal total system activity
- ❌ **College Independence**: Less isolated college data

**Security Mitigation:**
```python
# Use UUIDs instead of sequential IDs for better security
import uuid

def create_event(event_data):
    event_data['id'] = str(uuid.uuid4())
    return insert_event(event_data)
```

### 🏢 Option 2: College-Scoped Event IDs

**Implementation:**
```sql
-- Events with college-scoped IDs
CREATE TABLE events (
    id INTEGER NOT NULL,
    college_id INTEGER NOT NULL REFERENCES colleges(id),
    title VARCHAR(255) NOT NULL,
    -- ... other fields
    PRIMARY KEY (id, college_id),
    UNIQUE(id, college_id)  -- Unique within college only
);
```

**Advantages:**
- ✅ **College Independence**: Each college manages its own ID space
- ✅ **Privacy**: Event counts not disclosed across colleges
- ✅ **Familiar Numbering**: Colleges can have Event #1, #2, etc.

**Disadvantages:**
- ❌ **API Complexity**: Requires college context in all event operations
- ❌ **Cross-College Limitations**: Difficult to implement shared events
- ❌ **Development Complexity**: More complex queries and joins
- ❌ **URL Structure**: Requires `/colleges/{college_id}/events/{event_id}`

---

## Data Organization Strategy

### 🗄️ Option 1: Unified Dataset (Recommended)

**Architecture:**
```sql
-- Single database with college-based partitioning
CREATE TABLE events (
    id BIGSERIAL PRIMARY KEY,
    college_id INTEGER NOT NULL,
    -- ... event fields
) PARTITION BY HASH (college_id);

-- Create partitions for performance
CREATE TABLE events_partition_0 PARTITION OF events
    FOR VALUES WITH (MODULUS 10, REMAINDER 0);
-- ... create 10 partitions total
```

**Advantages:**
- ✅ **Cross-College Analytics**: Easy system-wide reporting and insights
- ✅ **Shared Resources**: Common user management and authentication
- ✅ **Cost Efficiency**: Single database instance and maintenance
- ✅ **Feature Consistency**: Uniform features across all colleges
- ✅ **Data Backup**: Simplified backup and disaster recovery
- ✅ **Scalability**: Horizontal partitioning for performance

**Query Optimization:**
```sql
-- Always include college_id in WHERE clauses for partition pruning
SELECT * FROM events 
WHERE college_id = 1 AND date >= '2024-01-01';

-- Index strategy for multi-tenant queries
CREATE INDEX idx_events_college_date ON events (college_id, date);
CREATE INDEX idx_registrations_college_event ON registrations (college_id, event_id);
```

### 🏢 Option 2: College-Separated Datasets

**Architecture:**
```sql
-- Separate database per college
-- Database: college_1_events
-- Database: college_2_events
-- etc.

-- Or separate schemas
CREATE SCHEMA college_1;
CREATE SCHEMA college_2;

CREATE TABLE college_1.events (
    id SERIAL PRIMARY KEY,
    -- ... event fields (no college_id needed)
);
```

**Advantages:**
- ✅ **Data Isolation**: Complete separation between colleges
- ✅ **Independent Scaling**: Scale each college's database separately
- ✅ **Security**: Natural data boundaries and access control
- ✅ **Customization**: College-specific schema modifications possible

**Disadvantages:**
- ❌ **Operational Complexity**: 50 databases to maintain
- ❌ **Cross-College Features**: Nearly impossible to implement
- ❌ **Analytics Limitations**: Complex to generate system-wide reports
- ❌ **Cost**: Higher infrastructure and maintenance costs
- ❌ **Development Overhead**: College-specific deployment pipelines

---

## Recommended Architecture

### 🎯 Hybrid Approach: Unified Dataset with Logical Separation

**Database Design:**
```sql
-- Core tables with college-based partitioning
CREATE TABLE colleges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(50) UNIQUE,  -- college1.eventmanager.com
    settings JSONB,  -- College-specific configurations
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE events (
    id BIGSERIAL PRIMARY KEY,  -- Globally unique
    college_id INTEGER NOT NULL REFERENCES colleges(id),
    title VARCHAR(255) NOT NULL,
    -- ... other fields
    created_at TIMESTAMP DEFAULT NOW()
) PARTITION BY HASH (college_id);

-- Row Level Security for data isolation
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY college_isolation ON events
    FOR ALL TO application_role
    USING (college_id = current_setting('app.current_college_id')::INTEGER);
```

**Application Layer:**
```python
# College context middleware
class CollegeContextMiddleware:
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        # Extract college from subdomain or header
        college_id = self.extract_college_id(scope)
        
        # Set database session variable
        await set_session_variable('app.current_college_id', college_id)
        
        return await self.app(scope, receive, send)

# College-scoped queries automatically
def get_events(db: Session, college_id: int):
    # RLS automatically filters by college_id
    return db.query(Event).all()
```

**API Design:**
```yaml
# URL Structure
/api/v1/events/{event_id}  # Global event ID
/api/v1/colleges/{college_id}/events  # College-scoped listing

# Headers
X-College-ID: 1  # Alternative to subdomain-based routing
```

---

## Performance Considerations

### 📈 Database Optimization

**Indexing Strategy:**
```sql
-- Composite indexes for common query patterns
CREATE INDEX idx_events_college_date ON events (college_id, date DESC);
CREATE INDEX idx_registrations_student_college ON registrations (student_id, college_id);
CREATE INDEX idx_attendance_event_college ON attendance (event_id, college_id);

-- Partial indexes for active events
CREATE INDEX idx_active_events ON events (college_id, date) 
WHERE date >= CURRENT_DATE;
```

**Query Performance:**
```sql
-- Efficient college-scoped queries
EXPLAIN (ANALYZE, BUFFERS) 
SELECT e.*, COUNT(r.id) as registration_count
FROM events e
LEFT JOIN registrations r ON e.id = r.event_id
WHERE e.college_id = 1 
  AND e.date >= CURRENT_DATE
GROUP BY e.id
ORDER BY e.date;
```

**Caching Strategy:**
```python
# Redis caching for frequently accessed data
@cache(expire=300)  # 5 minutes
def get_college_events(college_id: int):
    return db.query(Event).filter(Event.college_id == college_id).all()

# Cache invalidation on updates
def create_event(event_data):
    event = Event(**event_data)
    db.add(event)
    db.commit()
    
    # Invalidate college events cache
    cache.delete(f"college_events:{event.college_id}")
    return event
```

### 🚀 Scaling Strategies

**Horizontal Scaling:**
```yaml
# Database read replicas
primary_db:
  host: primary.db.eventmanager.com
  role: write

read_replicas:
  - host: replica1.db.eventmanager.com
    role: read
  - host: replica2.db.eventmanager.com
    role: read

# Application load balancing
load_balancer:
  algorithm: round_robin
  health_check: /health
  instances:
    - app1.eventmanager.com
    - app2.eventmanager.com
    - app3.eventmanager.com
```

**Vertical Scaling Thresholds:**
```yaml
# Database scaling triggers
cpu_threshold: 70%
memory_threshold: 80%
connection_threshold: 80%

# Auto-scaling configuration
min_instances: 2
max_instances: 10
scale_up_threshold: 70%
scale_down_threshold: 30%
```

---

## Data Volume Projections

### 📊 Storage Requirements

**Annual Data Growth:**
```python
# Calculate storage requirements
colleges = 50
students_per_college = 500
events_per_semester = 20
semesters_per_year = 2

# Core data
total_users = colleges * (students_per_college + 3)  # +3 admins per college
annual_events = colleges * events_per_semester * semesters_per_year
annual_registrations = annual_events * (students_per_college * 0.4)  # 40% participation
annual_attendance = annual_registrations * 0.8  # 80% attendance rate
annual_feedback = annual_attendance * 0.6  # 60% feedback rate

print(f"""
Annual Data Volume:
- Users: {total_users:,}
- Events: {annual_events:,}
- Registrations: {annual_registrations:,}
- Attendance: {annual_attendance:,}
- Feedback: {annual_feedback:,}
""")

# Storage estimates (bytes)
user_record_size = 500
event_record_size = 1000
registration_record_size = 200
attendance_record_size = 300
feedback_record_size = 1500

annual_storage = (
    total_users * user_record_size +
    annual_events * event_record_size +
    annual_registrations * registration_record_size +
    annual_attendance * attendance_record_size +
    annual_feedback * feedback_record_size
)

print(f"Estimated annual storage: {annual_storage / (1024**3):.2f} GB")
```

**5-Year Projection:**
```
Year 1: ~2.5 GB
Year 2: ~5.0 GB
Year 3: ~7.5 GB
Year 4: ~10.0 GB
Year 5: ~12.5 GB

With indexes and overhead: ~25 GB by Year 5
```

---

## Security & Compliance

### 🔒 Multi-Tenant Security

**Data Isolation:**
```sql
-- Row Level Security policies
CREATE POLICY user_college_isolation ON users
    FOR ALL TO application_role
    USING (college_id = current_setting('app.current_college_id')::INTEGER);

CREATE POLICY event_college_isolation ON events
    FOR ALL TO application_role
    USING (college_id = current_setting('app.current_college_id')::INTEGER);
```

**Access Control:**
```python
# Role-based access with college context
class CollegePermission:
    def __init__(self, college_id: int, role: str):
        self.college_id = college_id
        self.role = role
    
    def can_access_event(self, event_id: int) -> bool:
        event = get_event(event_id)
        return event.college_id == self.college_id
    
    def can_manage_users(self) -> bool:
        return self.role == 'admin'
```

**Audit Logging:**
```python
# College-scoped audit trail
def log_action(user_id: int, action: str, resource_id: int, college_id: int):
    audit_log = AuditLog(
        user_id=user_id,
        college_id=college_id,
        action=action,
        resource_id=resource_id,
        timestamp=datetime.utcnow()
    )
    db.add(audit_log)
    db.commit()
```

---

## Implementation Recommendations

### ✅ Recommended Approach

**1. Global Event IDs with UUIDs**
```python
# Use UUIDs for security and uniqueness
import uuid

class Event(Base):
    __tablename__ = "events"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    college_id = Column(Integer, ForeignKey("colleges.id"), nullable=False)
    # ... other fields
```

**2. Unified Dataset with Partitioning**
```sql
-- Hash partitioning for even distribution
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id INTEGER NOT NULL,
    -- ... other fields
) PARTITION BY HASH (college_id);
```

**3. College Context Middleware**
```python
# Automatic college context injection
@app.middleware("http")
async def college_context_middleware(request: Request, call_next):
    college_id = extract_college_from_request(request)
    request.state.college_id = college_id
    
    response = await call_next(request)
    return response
```

**4. Performance Monitoring**
```python
# Track performance metrics per college
@monitor_performance
def get_college_events(college_id: int):
    with timer(f"get_events_college_{college_id}"):
        return query_events(college_id)
```

---

## Migration Strategy

### 🔄 Phased Implementation

**Phase 1: Single College (MVP)**
- Implement core functionality for one college
- Validate data model and performance
- Establish monitoring and alerting

**Phase 2: Multi-College Support**
- Add college context and RLS
- Implement college-scoped APIs
- Add cross-college analytics

**Phase 3: Scale Optimization**
- Implement partitioning and sharding
- Add caching and read replicas
- Optimize for 50+ colleges

**Phase 4: Advanced Features**
- Inter-college events and collaborations
- Advanced analytics and reporting
- Mobile app optimization

---

## Conclusion

**Recommended Architecture:**
- ✅ **Global Event IDs (UUIDs)** for simplicity and security
- ✅ **Unified Dataset** with hash partitioning for performance
- ✅ **Row Level Security** for data isolation
- ✅ **College Context Middleware** for automatic scoping
- ✅ **Comprehensive Monitoring** for performance tracking

This approach provides the best balance of simplicity, performance, security, and scalability for the specified requirements while maintaining flexibility for future growth and feature development.
