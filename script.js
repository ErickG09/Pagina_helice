const API_URL = 'https://api-helice.onrender.com/api/datos'; 

const ctxGauge = document.getElementById('gaugeChart').getContext('2d');
const ctxLine = document.getElementById('lineChart').getContext('2d');

// Gráfico de progreso circular
const gaugeChart = new Chart(ctxGauge, {
    type: 'doughnut',  
    data: {
        labels: ['Energía Generada', 'Energía Restante'],
        datasets: [{
            data: [0, 8],  // Valores iniciales: máximo de 8
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
        label: 'Voltaje',
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
                max: 8  // Cambia el valor máximo a 8 para voltaje
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
            // Limitar el voltaje a un máximo de 8
            if (voltajeActual > 8) {
                voltajeActual = 8;
            }

            // Actualizar el gráfico circular
            gaugeChart.data.datasets[0].data = [voltajeActual, 8 - voltajeActual];
            gaugeChart.update(); // Redibujar gráfico de gauge

            // Actualizar el gráfico de línea
            lineChartData.labels.push(now);
            lineChartData.datasets[0].data.push(voltajeActual);
            lineChart.update();

            // Acumular energía total
            totalEnergia += parseFloat(voltajeActual);

            // Actualizar valores en el HTML
            document.getElementById('voltaje-actual').textContent = voltajeActual + " V";
            document.getElementById('total-energia').textContent = totalEnergia.toFixed(2) + " V";

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
    setInterval(actualizarGraficos, 2000);  // Actualizar cada 2 segundos
};
