# Campus Event Management System - Assumptions & Edge Cases

## Overview
This document outlines the system assumptions and comprehensive edge cases for the Campus Event Management System. Understanding these scenarios is crucial for robust system design, proper error handling, and maintaining data integrity.

## Table of Contents
- [System Assumptions](#system-assumptions)
- [Registration Edge Cases](#registration-edge-cases)
- [Attendance Tracking Edge Cases](#attendance-tracking-edge-cases)
- [Event Management Edge Cases](#event-management-edge-cases)
- [Feedback System Edge Cases](#feedback-system-edge-cases)
- [Data Integrity Edge Cases](#data-integrity-edge-cases)
- [System Failure Scenarios](#system-failure-scenarios)
- [Security Edge Cases](#security-edge-cases)
- [Performance Edge Cases](#performance-edge-cases)

---

## System Assumptions

### 📋 Normal Operation Assumptions

#### User Behavior Assumptions
- **Single Device Login**: Users typically access the system from one device at a time
- **Network Connectivity**: Users have stable internet connection during critical operations
- **Browser Compatibility**: Users use modern browsers with JavaScript enabled
- **Mobile Usage**: Students primarily use mobile devices for QR code scanning
- **Admin Supervision**: Admins are present during events for QR code scanning

#### Data Assumptions
- **Unique Email Addresses**: Each user has a unique, valid email address
- **College Affiliation**: All users belong to a registered college
- **Event Timing**: Events are scheduled at least 1 hour in advance
- **Capacity Limits**: Event venues have realistic capacity constraints (10-10,000 attendees)
- **Feedback Timing**: Students provide feedback within 7 days post-event

#### Technical Assumptions
- **Database Availability**: SQLite/PostgreSQL database is accessible 99.9% of the time
- **JWT Token Validity**: Tokens expire within 24 hours for security
- **QR Code Lifespan**: QR codes remain valid for the duration of the event
- **File Storage**: System has adequate storage for user data and logs

---

## Registration Edge Cases

### 🚨 Duplicate Registration Scenarios

#### **Case 1: Simultaneous Registration Attempts**
**Scenario**: Two identical registration requests arrive simultaneously
```sql
-- Race condition prevention
BEGIN TRANSACTION;
SELECT COUNT(*) FROM registrations 
WHERE student_id = ? AND event_id = ?;
-- If count = 0, proceed with INSERT
INSERT INTO registrations (student_id, event_id, created_at) 
VALUES (?, ?, NOW());
COMMIT;
```
**Handling**: Database-level unique constraint + application-level validation
**Expected Behavior**: First request succeeds, second returns "Already registered"

#### **Case 2: Network Retry Duplicates**
**Scenario**: User clicks register multiple times due to slow network
**Handling**: 
- Frontend: Disable button after first click
- Backend: Idempotency check using request ID
- Database: Unique constraint on (student_id, event_id)

#### **Case 3: Cross-Platform Registration**
**Scenario**: User registers on web, then tries mobile app
**Handling**: Real-time sync check before allowing registration
**Expected Behavior**: Show "Already registered on [platform]" message

### 📅 Timing Edge Cases

#### **Case 4: Registration After Event Start**
**Scenario**: User attempts registration after event has begun
```javascript
// Frontend validation
const eventStartTime = new Date(event.date);
const currentTime = new Date();
if (currentTime >= eventStartTime) {
    showError("Registration closed - event has started");
    return;
}
```
**Handling**: Time-based validation on both frontend and backend
**Expected Behavior**: Registration blocked with appropriate message

#### **Case 5: Registration During Event Cancellation**
**Scenario**: User registers while admin is cancelling the event
**Handling**: Event status check in registration validation
**Expected Behavior**: Registration fails, user notified of cancellation

### 🎯 Capacity Edge Cases

#### **Case 6: Over-Capacity Registration**
**Scenario**: Multiple users register simultaneously when only 1 spot remains
```sql
-- Atomic capacity check and registration
WITH capacity_check AS (
    SELECT (max_attendees - COUNT(r.id)) as available_spots
    FROM events e
    LEFT JOIN registrations r ON e.id = r.event_id
    WHERE e.id = ?
)
INSERT INTO registrations (student_id, event_id, created_at)
SELECT ?, ?, NOW()
FROM capacity_check
WHERE available_spots > 0;
```
**Handling**: Atomic database operation with capacity validation
**Expected Behavior**: Exact capacity maintained, excess registrations rejected

#### **Case 7: Waitlist Management**
**Scenario**: Event is full but users still want to register
**Handling**: Implement waitlist table with priority queue
**Expected Behavior**: Users added to waitlist, notified if spots open

---

## Attendance Tracking Edge Cases

### 📱 QR Code Edge Cases

#### **Case 8: Expired QR Code**
**Scenario**: Student tries to use QR code generated hours ago
```json
{
    "type": "attendance",
    "eventId": 123,
    "studentId": 456,
    "timestamp": "2024-01-15T10:00:00Z",
    "expiresAt": "2024-01-15T18:00:00Z"
}
```
**Handling**: Timestamp validation with configurable expiry (default: 6 hours)
**Expected Behavior**: QR code rejected, user prompted to generate new one

#### **Case 9: Malformed QR Code**
**Scenario**: QR code is corrupted or manually edited
**Handling**: JSON parsing with try-catch and schema validation
**Expected Behavior**: Clear error message "Invalid QR code format"

#### **Case 10: Wrong Event QR Code**
**Scenario**: Student scans QR for different event
**Handling**: Event ID validation against current context
**Expected Behavior**: "QR code is for different event" error

### ⏰ Timing Edge Cases

#### **Case 11: Early Check-in Attempt**
**Scenario**: Student tries to check in 2 hours before event
```python
def validate_checkin_time(event_date, buffer_minutes=30):
    current_time = datetime.utcnow()
    event_start = datetime.fromisoformat(event_date)
    earliest_checkin = event_start - timedelta(minutes=buffer_minutes)
    
    if current_time < earliest_checkin:
        raise ValidationError("Check-in not yet available")
```
**Handling**: Time window validation (30 minutes before event)
**Expected Behavior**: Check-in blocked until appropriate time

#### **Case 12: Late Check-in Attempt**
**Scenario**: Student tries to check in 3 hours after event ended
**Handling**: Configurable late check-in window (default: 1 hour post-event)
**Expected Behavior**: Check-in allowed with "Late arrival" flag

### 🔄 Duplicate Attendance Edge Cases

#### **Case 13: Multiple Check-in Attempts**
**Scenario**: Student scans QR multiple times
**Handling**: Database unique constraint + graceful response
**Expected Behavior**: "Already checked in at [time]" message

#### **Case 14: Admin and Student Simultaneous Check-in**
**Scenario**: Admin scans student QR while student self-checks-in
**Handling**: Database-level race condition prevention
**Expected Behavior**: First successful check-in wins, second gets confirmation

---

## Event Management Edge Cases

### 🚫 Event Cancellation Scenarios

#### **Case 15: Event Cancelled After Registrations**
**Scenario**: Admin cancels event with 50 registered students
```python
def cancel_event(event_id, reason):
    # Update event status
    event.status = "cancelled"
    event.cancellation_reason = reason
    
    # Notify all registered students
    registrations = get_event_registrations(event_id)
    for registration in registrations:
        send_cancellation_email(registration.student_id, event, reason)
    
    # Handle refunds if applicable
    process_refunds(event_id)
```
**Handling**: 
- Update event status to "cancelled"
- Send notifications to all registered students
- Prevent new registrations
- Handle attendance data cleanup

#### **Case 16: Event Cancelled During Attendance**
**Scenario**: Emergency cancellation while students are checking in
**Handling**: 
- Immediate status update
- Stop accepting new check-ins
- Notify on-site attendees
- Mark partial attendance records

### 📝 Event Modification Edge Cases

#### **Case 17: Capacity Reduction Below Current Registrations**
**Scenario**: Admin reduces capacity from 100 to 50, but 80 are registered
```python
def update_event_capacity(event_id, new_capacity):
    current_registrations = count_registrations(event_id)
    
    if new_capacity < current_registrations:
        # Options: 1) Reject change, 2) Implement waitlist, 3) Allow override
        raise ValidationError(
            f"Cannot reduce capacity below current registrations ({current_registrations})"
        )
```
**Handling**: Validation prevents capacity reduction below current registrations
**Alternative**: Implement "grandfathered" registrations system

#### **Case 18: Event Date Change After Registrations**
**Scenario**: Event moved from Saturday to Wednesday
**Handling**:
- Send notification to all registered students
- Provide opt-out option with deadline
- Track attendance impact

### 🏢 Venue Edge Cases

#### **Case 19: Double-Booked Venue**
**Scenario**: Two events scheduled for same venue and time
**Handling**: Venue conflict detection in event creation
**Expected Behavior**: Warning message with alternative suggestions

---

## Feedback System Edge Cases

### 📝 Missing Feedback Scenarios

#### **Case 20: No Feedback Submitted**
**Scenario**: Only 20% of attendees provide feedback
**Handling**: 
- Send reminder emails 24 hours post-event
- Implement feedback incentives
- Calculate ratings with minimum threshold warnings
```python
def calculate_event_rating(event_id):
    feedback_count = count_feedback(event_id)
    attendance_count = count_attendance(event_id)
    
    response_rate = feedback_count / attendance_count
    if response_rate < 0.3:  # Less than 30% response
        return {
            "rating": calculate_average_rating(event_id),
            "confidence": "low",
            "warning": "Low response rate - results may not be representative"
        }
```

#### **Case 21: Delayed Feedback Submission**
**Scenario**: Student provides feedback 2 weeks after event
**Handling**: Accept with timestamp, flag as "delayed feedback"
**Expected Behavior**: Include in analytics with appropriate weighting

### ⭐ Rating Edge Cases

#### **Case 22: Extreme Rating Patterns**
**Scenario**: Event receives only 1-star and 5-star ratings (no middle ground)
**Handling**: Detect polarized feedback patterns
```python
def detect_rating_anomalies(event_id):
    ratings = get_event_ratings(event_id)
    rating_distribution = Counter(ratings)
    
    # Check for polarization (only extreme ratings)
    extreme_ratings = rating_distribution[1] + rating_distribution[5]
    total_ratings = sum(rating_distribution.values())
    
    if extreme_ratings / total_ratings > 0.8:
        return {"anomaly": "polarized_feedback", "confidence": 0.8}
```

#### **Case 23: Duplicate Feedback Attempts**
**Scenario**: Student tries to submit multiple feedback entries
**Handling**: Database constraint prevents duplicates
**Expected Behavior**: "Feedback already submitted" message with edit option

---

## Data Integrity Edge Cases

### 🔗 Referential Integrity Issues

#### **Case 24: Orphaned Records**
**Scenario**: Student account deleted but registrations remain
```sql
-- Cleanup orphaned registrations
DELETE FROM registrations 
WHERE student_id NOT IN (SELECT id FROM users WHERE role = 'student');

-- Cleanup orphaned attendance
DELETE FROM attendance 
WHERE student_id NOT IN (SELECT id FROM users);
```
**Handling**: Cascade delete policies and regular cleanup jobs

#### **Case 25: Inconsistent Attendance Records**
**Scenario**: Attendance record exists without corresponding registration
**Handling**: Data validation constraints and repair procedures
```python
def validate_attendance_integrity():
    orphaned_attendance = """
    SELECT a.id FROM attendance a
    LEFT JOIN registrations r ON a.registration_id = r.id
    WHERE r.id IS NULL
    """
    # Flag for manual review or auto-correction
```

### 📊 Analytics Edge Cases

#### **Case 26: Division by Zero in Calculations**
**Scenario**: Calculating attendance rate for event with no registrations
```python
def safe_calculate_rate(numerator, denominator):
    if denominator == 0:
        return {"rate": 0, "warning": "No data available for calculation"}
    return {"rate": numerator / denominator}
```

#### **Case 27: Negative Metrics**
**Scenario**: Data corruption leads to negative attendance counts
**Handling**: Input validation and data sanitization
```python
def validate_metrics(metrics):
    for key, value in metrics.items():
        if isinstance(value, (int, float)) and value < 0:
            logger.error(f"Negative metric detected: {key}={value}")
            metrics[key] = 0  # Reset to safe default
```

---

## System Failure Scenarios

### 💾 Database Failures

#### **Case 28: Database Connection Loss During Registration**
**Scenario**: Database becomes unavailable mid-transaction
**Handling**: 
- Connection retry with exponential backoff
- Queue operations for later processing
- Graceful degradation with cached data
```python
@retry(max_attempts=3, backoff_factor=2)
def register_student(student_id, event_id):
    try:
        return create_registration(student_id, event_id)
    except DatabaseConnectionError:
        # Queue for later processing
        queue_registration_request(student_id, event_id)
        raise ServiceUnavailableError("Registration queued - will process when available")
```

#### **Case 29: Partial Transaction Failure**
**Scenario**: Registration succeeds but email notification fails
**Handling**: Implement saga pattern or eventual consistency
```python
def register_with_notification(student_id, event_id):
    try:
        # Step 1: Create registration
        registration = create_registration(student_id, event_id)
        
        # Step 2: Queue email notification
        queue_email_notification(registration.id)
        
        return registration
    except Exception as e:
        # Compensating action if needed
        rollback_registration(student_id, event_id)
        raise
```

### 🌐 Network Failures

#### **Case 30: Offline QR Code Scanning**
**Scenario**: Mobile app loses internet during event check-in
**Handling**: 
- Local storage of scanned QR codes
- Background sync when connection restored
- Conflict resolution for duplicate entries

#### **Case 31: API Rate Limiting**
**Scenario**: High traffic during popular event registration
**Handling**: 
- Implement exponential backoff
- Queue management system
- Load balancing and scaling

---

## Security Edge Cases

### 🔒 Authentication Edge Cases

#### **Case 32: JWT Token Expiry During Operation**
**Scenario**: User's token expires while filling registration form
**Handling**: 
- Silent token refresh if refresh token valid
- Graceful re-authentication prompt
- Form data preservation during re-auth

#### **Case 33: Account Compromise**
**Scenario**: Student account used by unauthorized person
**Handling**: 
- Unusual activity detection
- Account suspension mechanisms
- Audit trail for all actions

### 🎭 Role-Based Access Edge Cases

#### **Case 34: Role Change During Session**
**Scenario**: User promoted from student to admin mid-session
**Handling**: 
- Force re-authentication for role changes
- Session invalidation and refresh
- Permission re-validation on sensitive operations

---

## Performance Edge Cases

### 📈 High Load Scenarios

#### **Case 35: Viral Event Registration**
**Scenario**: 10,000 students try to register simultaneously
**Handling**: 
- Database connection pooling
- Request queuing and rate limiting
- Horizontal scaling triggers

#### **Case 36: Large Event Attendance**
**Scenario**: 5,000 attendees checking in within 30 minutes
**Handling**: 
- Multiple QR scanning stations
- Batch processing of attendance records
- Real-time dashboard optimization

### 💾 Storage Edge Cases

#### **Case 37: Database Storage Exhaustion**
**Scenario**: Database reaches storage limit during peak usage
**Handling**: 
- Automated storage monitoring
- Data archival procedures
- Emergency cleanup protocols

---

## Mitigation Strategies

### 🛡️ Prevention Measures

1. **Input Validation**: Comprehensive validation at all system entry points
2. **Database Constraints**: Foreign keys, unique constraints, check constraints
3. **Transaction Management**: ACID compliance for critical operations
4. **Monitoring & Alerting**: Real-time system health monitoring
5. **Graceful Degradation**: Fallback mechanisms for service failures

### 🔧 Recovery Procedures

1. **Data Backup**: Regular automated backups with point-in-time recovery
2. **Rollback Procedures**: Safe rollback mechanisms for failed deployments
3. **Manual Override**: Admin tools for edge case resolution
4. **Audit Logging**: Comprehensive logging for forensic analysis
5. **Health Checks**: Automated system health validation

### 📋 Testing Strategies

1. **Unit Tests**: Cover all edge case scenarios
2. **Integration Tests**: Test system component interactions
3. **Load Testing**: Simulate high-traffic scenarios
4. **Chaos Engineering**: Intentional failure injection testing
5. **User Acceptance Testing**: Real-world scenario validation

---

## Conclusion

Understanding and properly handling these assumptions and edge cases is crucial for building a robust Campus Event Management System. Regular review and testing of these scenarios ensures system reliability and user satisfaction.

**Key Principles**:
- **Fail Gracefully**: Always provide meaningful error messages
- **Data Integrity**: Maintain consistency across all operations
- **User Experience**: Minimize impact of edge cases on user workflow
- **Monitoring**: Track and alert on edge case occurrences
- **Documentation**: Keep edge case handling well-documented for maintenance
