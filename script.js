const API_URL = 'https://api-helice.onrender.com/api/datos'; 

const ctxGauge = document.getElementById('gaugeChart').getContext('2d');
const ctxLine = document.getElementById('lineChart').getContext('2d');

// Gráfico de progreso circular
const gaugeChart = new Chart(ctxGauge, {
    type: 'doughnut',  
    data: {
        labels: ['Energía Generada', 'Energía Restante'],
        datasets: [{
            data: [0, 5],  // Valores iniciales
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
                max: 5  // Ajusta el valor máximo para el voltaje
            }
        }
    }
});

// Variables para energía total y voltaje
let totalEnergia = 0;

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
        let voltajeActual = datos[datos.length - 1].valor;  // Obtén el valor más reciente
        
        // Ajustar la hora a la zona horaria de México usando Luxon
        let now = luxon.DateTime.fromISO(datos[datos.length - 1].timestamp).setZone('America/Mexico_City');
        let horaMexico = now.toFormat('dd/MM/yyyy HH:mm:ss');

        // Limitar el voltaje a un máximo de 5
        if (voltajeActual > 5) {
            voltajeActual = 5;
        }

        // Actualizar el gráfico circular
        gaugeChart.data.datasets[0].data = [voltajeActual, 5 - voltajeActual];
        gaugeChart.update(); // Redibujar gráfico de gauge

        // Actualizar el gráfico de línea
        lineChartData.labels.push(horaMexico);
        lineChartData.datasets[0].data.push(voltajeActual);
        lineChart.update(); 

        // Acumular energía total
        totalEnergia += parseFloat(voltajeActual);

        // Actualizar valores en el HTML
        document.getElementById('voltaje-actual').textContent = voltajeActual + " V";
        document.getElementById('total-energia').textContent = totalEnergia.toFixed(2) + " V";
    }
}

// Generar nuevos valores al cargar la página
window.onload = () => {
    // Llamar la función para actualizar gráficos y obtener datos de la API
    actualizarGraficos();
    setInterval(actualizarGraficos, 3000);  // Actualizar cada 3 segundos
};
