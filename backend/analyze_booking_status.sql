SELECT 
  status,
  payment_status,
  COUNT(*) as count,
  CASE 
    WHEN payment_expires_at < NOW() THEN 'EXPIRED'
    ELSE 'ACTIVE'
  END as expiry_status
FROM bookings 
GROUP BY status, payment_status, (payment_expires_at < NOW())
ORDER BY count DESC;