INSERT INTO admins (name, email, password_hash, role)
VALUES
  ('George Mukasa', 'george@example.com', '$2b$10$2Pwet4v3f7edD01bn4atrO8NnW4p3rS1wD.qvYJ3UYPSdToDk2hWm', 'doc-verifier'),
  ('Sarah Oketcho', 'sarah@example.com', '$2b$10$2Pwet4v3f7edD01bn4atrO8NnW4p3rS1wD.qvYJ3UYPSdToDk2hWm', 'pension-committee'),
  ('Daniel Kato', 'daniel@example.com', '$2b$10$2Pwet4v3f7edD01bn4atrO8NnW4p3rS1wD.qvYJ3UYPSdToDk2hWm', 'healthcare-committee'),
  ('Catherine Amony', 'catherine@example.com', '$2b$10$2Pwet4v3f7edD01bn4atrO8NnW4p3rS1wD.qvYJ3UYPSdToDk2hWm', 'education-committee'),
  ('Moses Wamala', 'moses@example.com', '$2b$10$2Pwet4v3f7edD01bn4atrO8NnW4p3rS1wD.qvYJ3UYPSdToDk2hWm', 'super-admin')
ON CONFLICT (email) DO NOTHING;

INSERT INTO veterans (
  full_name,
  email,
  password_hash,
  phone,
  service_number,
  national_id,
  service_branch,
  rank,
  years_served,
  verification_status
)
VALUES
  (
    'Amina Nakato',
    'amina@example.com',
    '$2b$10$2Pwet4v3f7edD01bn4atrO8NnW4p3rS1wD.qvYJ3UYPSdToDk2hWm',
    '+256772111111',
    'UPDF-1001',
    'CM1001',
    'Land Force',
    'Captain',
    12,
    'approved'
  ),
  (
    'Joseph Muwonge',
    'joseph@example.com',
    '$2b$10$2Pwet4v3f7edD01bn4atrO8NnW4p3rS1wD.qvYJ3UYPSdToDk2hWm',
    '+256772222222',
    'UPDF-1002',
    'CM1002',
    'Air Force',
    'Sergeant',
    8,
    'pending'
  ),
  (
    'Ruth Namuddu',
    'ruth@example.com',
    '$2b$10$2Pwet4v3f7edD01bn4atrO8NnW4p3rS1wD.qvYJ3UYPSdToDk2hWm',
    '+256772333333',
    'UPDF-1003',
    'CM1003',
    'Reserve Force',
    'Lieutenant',
    10,
    'approved'
  )
ON CONFLICT (email) DO NOTHING;
