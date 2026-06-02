const express = require('express');
const cors = require('cors');

const AuthRoutes = require('./src/routes/AuthRoutes');
const UsuarioRoutes = require('./src/routes/UsuarioRoutes');
const CategoriaRoutes = require('./src/routes/CategoriaRoutes');
const NoticiaRoutes = require('./src/routes/NoticiaRoutes');
const AtletaRoutes = require('./src/routes/AtletaRoutes');
const PartidaRoutes = require('./src/routes/PartidaRoutes');
const PlanoRoutes = require('./src/routes/PlanoRoutes');
const AssinaturaRoutes = require('./src/routes/AssinaturaRoutes');
const ReservaRoutes = require('./src/routes/ReservaRoutes');
const { errorHandler, notFoundHandler } = require('./src/middlewares/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.use(AuthRoutes);
app.use(UsuarioRoutes);
app.use(CategoriaRoutes);
app.use(NoticiaRoutes);
app.use(AtletaRoutes);
app.use(PartidaRoutes);
app.use(PlanoRoutes);
app.use(AssinaturaRoutes);
app.use(ReservaRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
}

module.exports = app;
