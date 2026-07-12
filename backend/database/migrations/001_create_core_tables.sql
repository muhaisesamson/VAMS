CREATE TABLE IF NOT EXISTS admins (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(40) NOT NULL CHECK (
    role IN (
      'doc-verifier',
      'pension-committee',
      'healthcare-committee',
      'education-committee',
      'super-admin'
    )
  ),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS veterans (
  id BIGSERIAL PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(32),
  service_number VARCHAR(64) UNIQUE NOT NULL,
  national_id VARCHAR(64) UNIQUE NOT NULL,
  service_branch VARCHAR(80),
  rank VARCHAR(80),
  years_served INT,
  verification_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (
    verification_status IN ('pending', 'approved', 'rejected')
  ),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
  id BIGSERIAL PRIMARY KEY,
  veteran_id BIGINT NOT NULL REFERENCES veterans(id) ON DELETE CASCADE,
  doc_type VARCHAR(50) NOT NULL,
  file_path TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'approved', 'rejected')
  ),
  reviewed_by BIGINT REFERENCES admins(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS applications (
  id BIGSERIAL PRIMARY KEY,
  veteran_id BIGINT NOT NULL REFERENCES veterans(id) ON DELETE CASCADE,
  service_type VARCHAR(30) NOT NULL CHECK (
    service_type IN ('pension', 'healthcare', 'education')
  ),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'approved', 'rejected')
  ),
  amount NUMERIC(12,2),
  coverage_value VARCHAR(255),
  reviewed_by BIGINT REFERENCES admins(id),
  reviewed_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_veteran_status ON documents (veteran_id, status);
CREATE INDEX IF NOT EXISTS idx_applications_veteran_status ON applications (veteran_id, status);
CREATE INDEX IF NOT EXISTS idx_applications_service_status ON applications (service_type, status);
