class Usuario {
    constructor(id, nome, email, cpf, tipo_usuario = 'Socio') {
        this.id = id;
        this.nome = nome;
        this.email = email;
        this.cpf = cpf;
        this.tipo_usuario = tipo_usuario;
    }
}

module.exports = Usuario;
