const API_URL = 'https://api-helice.onrender.com/api/datos'; 

const ctxGauge = document.getElementById('gaugeChart').getContext('2d');
const ctxLine = document.getElementById('lineChart').getContext('2d');

// Gráfico de progreso circular
const gaugeChart = new Chart(ctxGauge, {
    type: 'doughnut',  
    data: {
        labels: ['Energía Generada', 'Energía Restante'],
        datasets: [{
            data: [0, 0.6],  // Cambia el valor inicial, máximo 0.6 (para mW)
            backgroundColor: ['#4caf50', '#ccc'],
            borderWidth: 1
        }]
    },
    options: {
        responsive: true,
        cutout: '70%', 
    }
});

// Gráfico de línea para voltaje
let lineChartData = {
    labels: [],
    datasets: [{
        label: 'Voltaje en mW',
        data: [],
        borderColor: 'green',
        borderWidth: 2,
        fill: false,
    }]
};

const lineChart = new Chart(ctxLine, {
    type: 'line',
    data: lineChartData,
    options: {
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'minute',
                    tooltipFormat: 'HH:mm',
                }
            },
            y: {
                beginAtZero: true,
                max: 0.6  // Cambia el valor máximo a 0.6 para mW
            }
        }
    }
});

// Variables para energía total, voltaje, y el último timestamp
let totalEnergia = 0;
let ultimoTimestamp = null;

// Función para obtener los datos desde la API
async function obtenerDatosDesdeAPI() {
    try {
        const response = await fetch(API_URL);
        const datos = await response.json();
        return datos;
    } catch (error) {
        console.error("Error al obtener los datos de la API:", error);
        return [];
    }
}

// Función para actualizar los gráficos con los nuevos valores
async function actualizarGraficos() {
    const datos = await obtenerDatosDesdeAPI();

    // Asegurarse de que los datos existen
    if (datos.length > 0) {
        let nuevoDato = datos[datos.length - 1];  // Obtener el último dato
        let voltajeActual = nuevoDato.valor;
        let now = new Date(nuevoDato.timestamp);

        // Verificar si el timestamp es nuevo y solo actualizar si el dato es nuevo
        if (ultimoTimestamp === null || new Date(nuevoDato.timestamp).getTime() !== new Date(ultimoTimestamp).getTime()) {
            // Convertir el valor recibido a mW con la nueva fórmula
            let voltajeEnMW = (voltajeActual * 10) * Math.pow(10, -3);  // Multiplicar por 10 y luego por 10^-3

            // Limitar el voltaje a un máximo de 0.6 mW (para mantener la escala)
            if (voltajeEnMW > 0.6) {
                voltajeEnMW = 0.6;
            }

            // Actualizar el gráfico circular
            gaugeChart.data.datasets[0].data = [voltajeEnMW, 0.6 - voltajeEnMW];
            gaugeChart.update(); // Redibujar gráfico de gauge

            // Actualizar el gráfico de línea
            lineChartData.labels.push(now);
            lineChartData.datasets[0].data.push(voltajeEnMW);
            lineChart.update();

            // Acumular energía total con el valor en mW
            totalEnergia += parseFloat(voltajeEnMW);

            // Actualizar valores en el HTML con la unidad mW
            document.getElementById('voltaje-actual').textContent = voltajeEnMW.toFixed(2) + " mW";
            document.getElementById('total-energia').textContent = totalEnergia.toFixed(2) + " mW";

            // Guardar el último timestamp como referencia
            ultimoTimestamp = nuevoDato.timestamp;
        } else {
            console.log('No hay datos nuevos. Esperando...');
        }
    } else {
        console.log('No se encontraron datos en la API.');
    }
}

// Generar nuevos valores al cargar la página
window.onload = () => {
    actualizarGraficos();
    setInterval(actualizarGraficos, 1000);  // Actualizar cada 2 segundos
};
