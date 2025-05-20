import { Conversation } from '@11labs/client';
import { ElevenLabsClient } from "elevenlabs";
import './Styles.css';

// Elementos del DOM
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const connectionStatus = document.getElementById('connectionStatus');
const agentStatus = document.getElementById('agentStatus');
const callTimer = document.getElementById('callTimer');
const currentScenario = document.getElementById('currentScenario');
const scenarioCards = document.querySelectorAll('.scenario-card');
const feedbackPanel = document.getElementById('feedbackPanel');
const feedbackSummary = document.getElementById('feedbackSummary');
const responseTimeEl = document.getElementById('responseTime');
const clarityScoreEl = document.getElementById('clarityScore');
const problemSolvingEl = document.getElementById('problemSolving');
// Elementos para los rationales
const responseTimeRationaleEl = document.getElementById('responseTimeRationale');
const clarityRationaleEl = document.getElementById('clarityRationale');
const problemSolvingRationaleEl = document.getElementById('problemSolvingRationale');

// Variables globales
let conversation;
let conversationId = null;
let timerInterval;
let startTime;
let selectedScenario = 'customer-complaint';
let responseMetrics = {
  responseTime: [],
  clarityScore: [],
  problemSolving: []
};

// Configuración de los escenarios de entrenamiento
const scenarios = {
  'customer-complaint': {
    agentId: 'aBIyIyyc3t3AnMh9ptwh',
    name: 'Manejo de Quejas',
    icon: 'exclamation-circle'
  },
  'technical-support': {
    agentId: 'aBIyIyyc3t3AnMh9ptwh',
    name: 'Soporte Técnico',
    icon: 'tools'
  },
  'sales-inquiry': {
    agentId: 'aBIyIyyc3t3AnMh9ptwh',
    name: 'Consultas de Ventas',
    icon: 'tags'
  }
};

// Crea el cliente con tu API key
const elevenLabsClient = new ElevenLabsClient({
  apiKey: "sk_7eeb7c4ed0e012fa9da9706ac89b64d89eb5eb50a9a940b4"  // <--- Pon aquí tu API Key real
});

// Función para actualizar la interfaz de usuario según los estados
function updateUI(isConnected, mode) {
  // Actualizar estado de conexión
  connectionStatus.textContent = isConnected ? 'Conectado' : 'Desconectado';
  connectionStatus.className = `status-value ${isConnected ? 'status-connected' : 'status-disconnected'}`;
  connectionStatus.innerHTML = `<i class="fas fa-${isConnected ? 'link' : 'plug'}"></i> ${isConnected ? 'Conectado' : 'Desconectado'}`;
  
  // Actualizar estado del agente
  if (mode) {
    const isSpeaking = mode === 'speaking';
    agentStatus.textContent = isSpeaking ? 'Hablando' : 'Escuchando';
    agentStatus.className = `status-value ${isSpeaking ? 'status-speaking' : 'status-listening'}`;
    agentStatus.innerHTML = `<i class="fas fa-${isSpeaking ? 'volume-up' : 'headphones'}"></i> ${isSpeaking ? 'Hablando' : 'Escuchando'}`;
  }
  
  // Actualizar botones
  startButton.disabled = isConnected;
  stopButton.disabled = !isConnected;
  
  // Activar/desactivar selección de escenarios
  scenarioCards.forEach(card => {
    card.style.pointerEvents = isConnected ? 'none' : 'auto';
    card.style.opacity = isConnected ? '0.7' : '1';
  });
  
  // Mostrar u ocultar panel de retroalimentación
  // feedbackPanel.style.display = !isConnected && responseMetrics.responseTime.length > 0 ? 'block' : 'none';
}

// Función para actualizar el timer de la llamada
function updateTimer() {
  if (!startTime) return;
  
  const now = new Date();
  const elapsedSeconds = Math.floor((now - startTime) / 1000);
  const minutes = Math.floor(elapsedSeconds / 60).toString().padStart(2, '0');
  const seconds = (elapsedSeconds % 60).toString().padStart(2, '0');
  
  callTimer.textContent = `${minutes}:${seconds}`;
}

// Función para iniciar el timer
function startTimer() {
  startTime = new Date();
  clearInterval(timerInterval);
  timerInterval = setInterval(updateTimer, 1000);
  updateTimer();
}

// Función para detener el timer
function stopTimer() {
  clearInterval(timerInterval);
  startTime = null;
  
  // Dejar el último tiempo visible
  setTimeout(() => {
    if (!startTime) {
      callTimer.textContent = '00:00';
    }
  }, 3000);
}

// Función para mostrar mensajes de error
function showError(message) {
  // Crear un elemento de alerta en lugar de usar alert()
  const alertBox = document.createElement('div');
  alertBox.style.position = 'fixed';
  alertBox.style.top = '20px';
  alertBox.style.left = '50%';
  alertBox.style.transform = 'translateX(-50%)';
  alertBox.style.backgroundColor = '#f8d7da';
  alertBox.style.color = '#842029';
  alertBox.style.padding = '15px 25px';
  alertBox.style.borderRadius = '5px';
  alertBox.style.boxShadow = '0 4px 10px rgba(0,0,0,0.15)';
  alertBox.style.zIndex = '9999';
  alertBox.style.maxWidth = '80%';
  alertBox.innerHTML = `<i class="fas fa-exclamation-circle"></i> Error: ${message}`;
  
  document.body.appendChild(alertBox);
  
  setTimeout(() => {
    alertBox.style.opacity = '0';
    alertBox.style.transition = 'opacity 0.5s ease';
    setTimeout(() => document.body.removeChild(alertBox), 500);
  }, 4000);
  
  console.error(message);
}

// Función para generar métricas simuladas para esta demostración
function generateSimulatedMetrics(conversationData) {
  if (!conversationData || !conversationData.analysis.evaluation_criteria_results) {
    console.warn("No se encontró la sección 'evaluation_criteria_results' en los datos de la conversación");
    return;
  }

  const evaluation_criteria_clarity_results = conversationData.analysis.evaluation_criteria_results.clarity.rationale;
  const evaluation_criteria_results_problem_solving_skills = conversationData.analysis.evaluation_criteria_results.problem_solving_skills.rationale;
  const evaluation_criteria_results_response_time = conversationData.analysis.evaluation_criteria_results.response_time.rationale;

  const evaluation = conversationData.analysis.evaluation_criteria_results;

  // Extraemos cada resultado y lo convertimos a 1 o 0 según success/failure
  const responseTimeResult = evaluation.response_time?.result === "success" ? "Aprovado" : "Reprovado";
  const clarityResult = evaluation.clarity?.result === "success" ? "Aprovado" : "Reprovado";
  const problemSolvingResult = evaluation.problem_solving_skills?.result === "success" ? "Aprovado" : "Reprovado";

  // Actualizamos los elementos en la UI
  responseTimeEl.textContent = responseTimeResult;
  clarityScoreEl.textContent = clarityResult;
  problemSolvingEl.textContent = problemSolvingResult;
  
  // Actualizamos los rationales
  responseTimeRationaleEl.textContent = evaluation_criteria_results_response_time || "No disponible";
  clarityRationaleEl.textContent = evaluation_criteria_clarity_results || "No disponible";
  problemSolvingRationaleEl.textContent = evaluation_criteria_results_problem_solving_skills || "No disponible";
}

// Función para generar retroalimentación personalizada
function generateFeedback(responseTime, clarityScore, problemSolving) {
  let feedbackText = '<h3>Resumen de tu desempeño</h3>';
  
  // Evaluación del tiempo de respuesta
  if (responseTime < 2.0) {
    feedbackText += '<p><strong>Tiempo de respuesta:</strong> Excelente. Tus respuestas son rápidas y oportunas, lo que contribuye a una excelente experiencia del cliente.</p>';
  } else if (responseTime < 3.0) {
    feedbackText += '<p><strong>Tiempo de respuesta:</strong> Bueno. Tu velocidad de respuesta es adecuada, pero hay margen para mejorar.</p>';
  } else {
    feedbackText += '<p><strong>Tiempo de respuesta:</strong> Necesita mejorar. Considera reducir los tiempos de pausa para mantener al cliente comprometido.</p>';
  }
  
  // Evaluación de la claridad
  if (clarityScore >= 85) {
    feedbackText += '<p><strong>Claridad de comunicación:</strong> Sobresaliente. Tu comunicación es clara, concisa y fácil de entender.</p>';
  } else if (clarityScore >= 70) {
    feedbackText += '<p><strong>Claridad de comunicación:</strong> Buena. Tu mensaje generalmente se entiende bien, pero considera trabajar en la estructuración de tus explicaciones.</p>';
  } else {
    feedbackText += '<p><strong>Claridad de comunicación:</strong> Necesita mejorar. Intenta utilizar un lenguaje más claro y evitar tecnicismos innecesarios.</p>';
  }
  
  // Evaluación de la resolución de problemas
  if (problemSolving >= 85) {
    feedbackText += '<p><strong>Resolución de problemas:</strong> Excelente. Demuestras gran habilidad para identificar problemas y ofrecer soluciones efectivas.</p>';
  } else if (problemSolving >= 70) {
    feedbackText += '<p><strong>Resolución de problemas:</strong> Buena. Manejas bien la mayoría de las situaciones, pero podrías mejorar en identificar soluciones más eficientes.</p>';
  } else {
    feedbackText += '<p><strong>Resolución de problemas:</strong> Necesita mejorar. Considera trabajar en tu capacidad para diagnosticar problemas y ofrecer soluciones adecuadas.</p>';
  }
  
  // Recomendaciones generales
  feedbackText += '<h3>Recomendaciones para mejorar</h3>';
  feedbackText += '<ul>';
  
  if (responseTime > 2.5) {
    feedbackText += '<li>Practica respuestas rápidas a preguntas comunes para reducir tu tiempo de respuesta.</li>';
  }
  
  if (clarityScore < 80) {
    feedbackText += '<li>Trabaja en organizar tus ideas antes de comunicarlas y utiliza ejemplos concretos.</li>';
  }
  
  if (problemSolving < 80) {
    feedbackText += '<li>Mejora tu conocimiento de los procedimientos y soluciones disponibles para problemas frecuentes.</li>';
  }
  
  feedbackText += '<li>Continúa practicando diversos escenarios para aumentar tu confianza y eficiencia.</li>';
  feedbackText += '</ul>';
  
  // Actualizar el panel de retroalimentación
  feedbackSummary.innerHTML = feedbackText;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchConversation(conversationIdToFetch) {
  if (!conversationIdToFetch) {
    showError("No se pudo recuperar la conversación: ID de conversación no proporcionado.");
    return;
  }

  await delay(10000);
  try {
    const conversationData = await elevenLabsClient.conversationalAi.getConversation(conversationIdToFetch);
    console.log("Datos de la conversación:", conversationData);

    generateSimulatedMetrics(conversationData);

  } catch (error) {
    showError(`No se pudo recuperar la conversación: ${error.message || 'Error desconocido'}`);
  }
}

// Iniciar conversación
async function startConversation() {
  try {
    // Cambiar apariencia del botón mientras se procesa
    startButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Conectando...';
    startButton.disabled = true;
    
    // Solicitar permiso para el micrófono
    await navigator.mediaDevices.getUserMedia({ audio: true })
      .catch(error => {
        throw new Error('Se requiere acceso al micrófono para iniciar la conversación');
      });
    
    // Obtener el escenario seleccionado
    const scenario = scenarios[selectedScenario];
    
    // Iniciar el cronómetro
    startTimer();
    
    // Iniciar la sesión de conversación
    conversation = await Conversation.startSession({
      agentId: scenario.agentId,

      //Aqui se pueden agregar variables para customizar al agente...
      //https://elevenlabs.io/docs/conversational-ai/customization/personalization/dynamic-variables

      onConnect: () => {
        console.log('Conexión establecida con el servidor');
        updateUI(true);
        
      },
      onDisconnect: async () => {
        console.log('Desconexión del servidor');
        stopTimer();
        
        const idToFetch = conversationId;

        if (idToFetch) {
          console.log('onDisconnect: Attempting to fetch conversation with ID:', idToFetch);
          try {
            await fetchConversation(idToFetch);
          } catch (error) {
            console.error("Error during fetchConversation called from onDisconnect:", error);
          }
        } else {
          console.warn("onDisconnect: conversationId was not set or already null. Cannot fetch conversation details.");
        }
        
        updateUI(false);
        conversation = null;
        conversationId = null;
      },
      onError: (error) => {
        showError(`Error en la conversación: ${error.message || 'Error desconocido'}`);
        stopTimer();
        updateUI(false);
      },
      onModeChange: (mode) => {
        console.log(`Modo cambiado a: ${mode.mode}`);
        updateUI(true, mode.mode);
      },
    });
  } catch (error) {
    showError(`No se pudo iniciar la conversación: ${error.message || 'Error desconocido'}`);
    stopTimer();
    updateUI(false);
    conversation = null;
  } finally {
    // Restaurar apariencia del botón
    startButton.innerHTML = '<i class="fas fa-headset"></i> Iniciar Simulación';
    startButton.disabled = false;
  }
}

// Detener conversación
async function stopConversation() {
  if (conversation) {
    try {
      stopButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Finalizando...';
      stopButton.disabled = true;

      conversationId = conversation.getId();
      console.log("ID de conversacion (set for onDisconnect): ", conversationId);
      
      await conversation.endSession();
      stopTimer();
      
      console.log('Sesión finalizada correctamente (control returned to stopConversation)');
    } catch (error) {
      showError(`Error al finalizar la conversación: ${error.message || 'Error desconocido'}`);
      stopTimer();
      updateUI(false);
      conversation = null;
      conversationId = null;
    } finally {
      stopButton.innerHTML = '<i class="fas fa-stop-circle"></i> Finalizar Simulación';
    }
  } else {
    console.warn("stopConversation called but no active conversation object found.");
    updateUI(false);
  }
}

// Configuración de selección de escenarios
function setupScenarioSelection() {
  scenarioCards.forEach(card => {
    card.addEventListener('click', () => {
      // Solo permitir cambio si no hay una sesión activa
      if (conversation) return;
      
      // Quitar clase activa de todos los cards
      scenarioCards.forEach(c => c.classList.remove('active'));
      
      // Añadir clase activa al seleccionado
      card.classList.add('active');
      
      // Actualizar escenario seleccionado
      selectedScenario = card.dataset.scenario;
      
      // Actualizar UI
      currentScenario.innerHTML = `<i class="fas fa-${scenarios[selectedScenario].icon}"></i> ${scenarios[selectedScenario].name}`;
    });
  });
  
  // Establecer el escenario inicial
  currentScenario.innerHTML = `<i class="fas fa-${scenarios[selectedScenario].icon}"></i> ${scenarios[selectedScenario].name}`;
}

// Agregar manejadores de eventos
startButton.addEventListener('click', startConversation);
stopButton.addEventListener('click', stopConversation);

// Manejar cierre de la ventana
window.addEventListener('beforeunload', () => {
  if (conversation) {
    conversation.endSession().catch(console.error);
  }
});

// Inicialización de la interfaz de usuario
updateUI(false);
setupScenarioSelection();