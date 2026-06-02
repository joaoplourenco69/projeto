ALTER TABLE usuarios
  MODIFY tipo_usuario ENUM('Admin', 'Socio') NOT NULL DEFAULT 'Socio',
  ADD COLUMN atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE categorias
  ADD UNIQUE KEY uk_categorias_nome (nome),
  ADD COLUMN criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE noticias
  ADD COLUMN atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE atletas
  ADD COLUMN criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE partidas
  MODIFY placar_spfc INT NOT NULL DEFAULT 0,
  MODIFY placar_adv INT NOT NULL DEFAULT 0,
  ADD COLUMN criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE planos
  ADD UNIQUE KEY uk_planos_nome_plano (nome_plano),
  ADD COLUMN criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

INSERT IGNORE INTO categorias (id, nome) VALUES
  (1, 'Futebol profissional'),
  (2, 'Base'),
  (3, 'Socio torcedor');

INSERT IGNORE INTO planos (id, nome_plano, mensalidade, beneficios) VALUES
  (1, 'Torcedor', 29.90, 'Conteudos exclusivos e prioridade em noticias.'),
  (2, 'Socio Tricolor', 59.90, 'Descontos em produtos oficiais e beneficios em jogos.'),
  (3, 'Diamante', 99.90, 'Beneficios premium, prioridade em ingressos e experiencias exclusivas.');

