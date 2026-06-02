ALTER TABLE partidas
  ADD COLUMN capacidade_total INT NOT NULL DEFAULT 45000,
  ADD COLUMN vagas_bloqueadas INT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS assinaturas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  plano_id INT NOT NULL,
  status ENUM('Pendente', 'Ativa', 'Suspensa', 'Cancelada') NOT NULL DEFAULT 'Pendente',
  forma_pagamento VARCHAR(40) NOT NULL DEFAULT 'pix',
  pagamento_status ENUM('Pendente', 'Aprovado', 'Recusado') NOT NULL DEFAULT 'Pendente',
  motivo_recusa VARCHAR(255),
  valor_mensal DECIMAL(10, 2) NOT NULL,
  desconto_percentual DECIMAL(5, 2) NOT NULL DEFAULT 0,
  valor_final DECIMAL(10, 2) NOT NULL,
  cep VARCHAR(8) NOT NULL,
  logradouro VARCHAR(160),
  numero VARCHAR(20) NOT NULL,
  complemento VARCHAR(80),
  bairro VARCHAR(100),
  cidade VARCHAR(100),
  uf CHAR(2),
  aprovado_em DATETIME,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_assinaturas_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_assinaturas_plano
    FOREIGN KEY (plano_id) REFERENCES planos(id)
    ON DELETE RESTRICT,
  INDEX idx_assinaturas_usuario_status (usuario_id, status),
  INDEX idx_assinaturas_pagamento_status (pagamento_status)
);

CREATE TABLE IF NOT EXISTS reservas_ingressos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  partida_id INT NOT NULL,
  assinatura_id INT NOT NULL,
  quantidade INT NOT NULL,
  valor_unitario DECIMAL(10, 2) NOT NULL,
  desconto_percentual DECIMAL(5, 2) NOT NULL DEFAULT 0,
  valor_total DECIMAL(10, 2) NOT NULL,
  status ENUM('Bloqueada', 'Confirmada', 'Cancelada', 'Expirada') NOT NULL DEFAULT 'Bloqueada',
  expira_em DATETIME NOT NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_reservas_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_reservas_partida
    FOREIGN KEY (partida_id) REFERENCES partidas(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_reservas_assinatura
    FOREIGN KEY (assinatura_id) REFERENCES assinaturas(id)
    ON DELETE RESTRICT,
  INDEX idx_reservas_usuario_partida_status (usuario_id, partida_id, status),
  INDEX idx_reservas_partida_status (partida_id, status)
);
