// Importa o SDK oficial do Google AI
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Pega a sua Chave de API secreta das "Environment Variables" da Netlify
// NUNCA COLOQUE A CHAVE DIRETAMENTE AQUI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Define o prompt do sistema (exatamente como o que tínhamos antes)
const systemPrompt = `Você é um corretor especialista em redações do ENEM. Seu objetivo é avaliar a redação do aluno com base nas 5 competências oficiais.
1.  **Competência 1 (C1):** Domínio da norma culta (gramática, ortografia, pontuação).
2.  **Competência 2 (C2):** Compreensão da proposta, aplicação de repertório sociocultural, estrutura dissertativa-argumentativa.
3.  **Competência 3 (C3):** Seleção, organização e desenvolvimento dos argumentos (coerência, autoria).
4.  **Competência 4 (C4):** Coesão textual (uso correto de conectivos e mecanismos linguísticos).
5.  **Competência 5 (C5):** Proposta de intervenção completa (deve ter 5 elementos: Ação, Agente, Meio/Modo, Finalidade e Detalhamento).

Forneça uma nota para CADA competência (0, 40, 80, 120, 160, ou 200).
Forneça um comentário construtivo para CADA competência, explicando a nota.
Forneça um comentário geral sobre a redação (pontos fortes e a melhorar).
Seja rigoroso, justo e objetivo, como um corretor oficial. Responda APENAS com o JSON solicitado.`;

// Define o schema JSON (exatamente como o que tínhamos antes)
const schema = {
  type: "OBJECT",
  properties: {
    "notaC1": { type: "NUMBER", description: "Nota da Competência 1 (0, 40, 80, 120, 160, ou 200)" },
    "comentarioC1": { type: "STRING", description: "Feedback detalhado sobre a Competência 1 (gramática, etc.)." },
    "notaC2": { type: "NUMBER", description: "Nota da Competência 2 (0, 40, 80, 120, 160, ou 200)" },
    "comentarioC2": { type: "STRING", description: "Feedback detalhado sobre a Competência 2 (tema, repertório, estrutura)." },
    "notaC3": { type: "NUMBER", description: "Nota da Competência 3 (0, 40, 80, 120, 160, ou 200)" },
    "comentarioC3": { type: "STRING", description: "Feedback detalhado sobre a Competência 3 (argumentação)." },
    "notaC4": { type: "NUMBER", description: "Nota da Competência 4 (0, 40, 80, 120, 160, ou 200)" },
    "comentarioC4": { type: "STRING", description: "Feedback detalhado sobre a Competência 4 (coesão e conectivos)." },
    "notaC5": { type: "NUMBER", description: "Nota da Competência 5 (0, 40, 80, 120, 160, ou 200)" },
    "comentarioC5": { type: "STRING", description: "Feedback detalhado sobre a Competência 5 (proposta de intervenção e 5 elementos)." },
    "comentariosGerais": { type: "STRING", description: "Um parágrafo de feedback geral (pontos fortes e principais pontos a melhorar)." }
  },
  required: ["notaC1", "comentarioC1", "notaC2", "comentarioC2", "notaC3", "comentarioC3", "notaC4", "comentarioC4", "notaC5", "comentarioC5", "comentariosGerais"]
};

// Esta é a função principal que a Netlify irá executar
exports.handler = async (event) => {
  // O 'event.body' contém os dados que o frontend enviou (tema e texto)
  const { tema, texto } = JSON.parse(event.body);

  if (!tema || !texto) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Tema e texto são obrigatórios." }),
    };
  }

  try {
    // 1. Inicializa o modelo
    // Usando o gemini-1.5-flash, que é excelente para isso e suporta o modo JSON
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
      systemInstruction: systemPrompt,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    // 2. Monta a pergunta do usuário
    const userQuery = `Por favor, corrija a seguinte redação no padrão ENEM:
TEMA: "${tema}"
TEXTO:
"${texto}"`;

    // 3. Chama a API
    const result = await model.generateContent(userQuery);
    const response = result.response;
    const feedbackJson = response.text();

    // 4. Retorna o JSON de feedback para o frontend
    return {
      statusCode: 200,
      body: feedbackJson, // O JSON já vem pronto da API
    };

  } catch (error) {
    console.error("Erro ao chamar a API Gemini:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Falha ao processar a correção no servidor." }),
    };
  }
};