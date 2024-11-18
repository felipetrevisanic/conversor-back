// backend/app.js
const express = require('express');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const cors = require('cors');
const axios = require('axios');


const app = express();
app.use(express.json());
app.use(cors());

// Carregar o arquivo .proto
const PROTO_PATH = path.join(__dirname, '..', 'moeda.proto');
const pacoteDefinicao = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const moedaProto = grpc.loadPackageDefinition(pacoteDefinicao).moeda;

// Criar o cliente gRPC
const cliente = new moedaProto.ConversorDeMoedas('localhost:50051', grpc.credentials.createInsecure());

app.get('/moedas', (req, res) => {
  cliente.ListarMoedas({}, (erro, resposta) => {
    if (erro) {
      console.error('Erro ao chamar o servidor gRPC:', erro);
      return res.status(500).json({ erro: 'Erro ao obter lista de moedas' });
    }

    console.log('Resposta do servidor gRPC (moedas):', resposta);
    res.json(resposta.moedas);
  });
});

// Endpoint REST para conversão de moeda
app.post('/converter', (req, res) => {
  const { valor, moeda_origem, moeda_destino } = req.body;

  console.log('Recebido POST /converter com os dados:', req.body);

  if (!valor || !moeda_origem || !moeda_destino) {
    console.error('Parâmetros inválidos:', req.body);
    return res.status(400).json({ erro: 'Parâmetros inválidos' });
  }

  cliente.Converter({ valor, moeda_origem, moeda_destino }, (erro, resposta) => {
    if (erro) {
      console.error('Erro ao chamar o servidor gRPC:', erro);
      return res.status(500).json({ erro: 'Erro ao converter moeda' });
    }
  
    console.log('Resposta do servidor gRPC:', resposta);
    res.json(resposta);
  });
});

const PORTA = 3001;
app.listen(PORTA, () => {
  console.log(`Backend rodando na porta ${PORTA}`);
});
