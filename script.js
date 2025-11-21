document.addEventListener('DOMContentLoaded', () => {
    // Ensure page starts at top
    if (window.history.replaceState) {
        window.history.replaceState(null, null, window.location.href);
    }
    
    const navButtons = document.querySelectorAll('.vertical-navigation-bar button');
    const sections = document.querySelectorAll('.slide');
    const countryFilter = document.getElementById('country-filter');

    // --- ScrollSpy & Navigation Logic ---
    function setupScrollSpy() {
        const observerOptions = {
            root: null,
            rootMargin: '-20% 0px -60% 0px', // Active when section is in the middle of viewport
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    updateActiveNav(id);
                }
            });
        }, observerOptions);

        sections.forEach(section => {
            observer.observe(section);
        });
    }

    function updateActiveNav(id) {
        navButtons.forEach(button => {
            const target = button.getAttribute('data-target');
            if (target === id) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }

    function setupSmoothScrolling() {
        navButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = button.getAttribute('data-target');
                const targetSection = document.getElementById(targetId);
                
                if (targetSection) {
                    targetSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    // Manually update active state immediately for better UX
                    updateActiveNav(targetId);
                }
            });
        });
    }

    // --- Chart Loading and Interactivity (Plotly.js) ---
    function loadCharts() {
        // Ensure Plotly is loaded before calling its methods
        if (typeof Plotly === 'undefined') {
            console.error("Plotly.js not loaded. Charts cannot be rendered.");
            const chartDivs = document.querySelectorAll('#income-group-chart, #population-growth-treemap, #population-growth-line-chart');
            chartDivs.forEach(div => {
                div.innerHTML = '<p style="color:red; text-align:center; padding-top: 20px;">Error: Chart library not loaded. Cannot display chart.</p>';
                div.classList.remove('chart-container-loading');
            });
            return;
        }

        // Helper to lazy load charts
        function lazyLoadChart(id, renderFn) {
            const chartDiv = document.getElementById(id);
            if (!chartDiv) return;

            const observer = new IntersectionObserver((entries, obs) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        renderFn(chartDiv);
                        obs.unobserve(entry.target);
                    }
                });
            }, { rootMargin: "200px" }); // Load when 200px away

            observer.observe(chartDiv);
        }

        // 1. Income Group Chart
        lazyLoadChart('income-group-chart', (div) => {
            Plotly.newPlot(div, [{
                x: ['Low Income', 'Lower Middle', 'Upper Middle', 'High Income'],
                y: [0.8, 1.5, 1.2, 0.5], // Example CAGR values
                type: 'bar',
                marker: { 
                    color: ['#d6d3d1', '#38b2ac', '#319795', '#2d3748'], // Teal & Gray mix
                    line: {
                        color: 'rgba(255,255,255,0.5)',
                        width: 1
                    }
                },
                hoverlabel: { bgcolor: "#1a202c", font: { color: "white" } },
                texttemplate: '%{y:.2f}%', 
                textposition: 'outside'
            }], {
                title: {
                    text: 'Population Growth Rate by Income Group (CAGR %)',
                    font: { size: 18, color: '#1a202c', family: 'Playfair Display, serif' }
                },
                xaxis: { 
                    title: 'Income Group', 
                    automargin: true,
                    tickfont: { size: 12, color: '#4a5568', family: 'Inter, sans-serif' },
                    gridcolor: '#e2e8f0'
                },
                yaxis: { 
                    title: 'CAGR %', 
                    automargin: true,
                    tickfont: { size: 12, color: '#4a5568', family: 'Inter, sans-serif' },
                    gridcolor: '#e2e8f0'
                },
                margin: { t: 60, b: 60, l: 60, r: 30 },
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)',
                font: { family: 'Inter, system-ui, sans-serif', size: 13 },
                config: { 
                    accessible: true, 
                    responsive: true,
                    displayModeBar: false
                }
            }).then(() => div.classList.remove('chart-container-loading'));
        });

        // 2. Treemap
        lazyLoadChart('population-growth-treemap', (div) => {
            Plotly.newPlot(div, [{
                type: "treemap",
                labels: ['Asia', 'Africa', 'Europe', 'North America', 'South America', 'Oceania',
                         'Sub-Saharan Africa', 'East Asia & Pacific', 'Europe & Central Asia'],
                parents: ['', '', '', '', '', '', 'Africa', 'Asia', 'Europe'],
                values:  [4700, 1400, 750, 600, 440, 43, 1200, 2300, 700], // Example population numbers (millions)
                marker: {
                    colors: [
                        '#2d3748', // Asia (Dark Blue-Gray)
                        '#4a5568', // Africa
                        '#718096', // Europe
                        '#a0aec0', // NA
                        '#cbd5e0', // SA
                        '#e2e8f0', // Oceania
                        '#38b2ac', // Sub-Saharan (Teal Accent)
                        '#319795', // East Asia
                        '#2c7a7b'  // Europe Central
                    ]
                },
                textinfo: "label+value+percent parent+percent root",
                hoverinfo: 'label+value+percent parent+percent root',
                hoverlabel: { bgcolor: "#1a202c", font: { color: "white" } }
            }], {
                title: {
                    text: 'Global Population Distribution & Regional Growth Focus',
                    font: { size: 18, color: '#1a202c', family: 'Playfair Display, serif' }
                },
                margin: {t: 60, l: 25, r: 25, b: 25},
                paper_bgcolor: 'rgba(0,0,0,0)',
                font: { family: 'Inter, system-ui, sans-serif', size: 13 },
                config: { 
                    accessible: true, 
                    responsive: true,
                    displayModeBar: false
                }
            }).then(() => div.classList.remove('chart-container-loading'));
        });

        // 3. Line Chart
        lazyLoadChart('population-growth-line-chart', (div) => {
            const allCountryData = {
                China: { x: [1960, 1980, 2000, 2020], y: [667, 981, 1262, 1412], name: 'China' },
                India: { x: [1960, 1980, 2000, 2020], y: [450, 698, 1053, 1380], name: 'India' },
                USA: { x: [1960, 1980, 2000, 2020], y: [180, 227, 282, 331], name: 'USA' },
                Indonesia: { x: [1960, 1980, 2000, 2020], y: [97, 150, 214, 273], name: 'Indonesia' },
                Pakistan: { x: [1960, 1980, 2000, 2020], y: [45, 82, 142, 220], name: 'Pakistan' },
                Brazil: { x: [1960, 1980, 2000, 2020], y: [72, 121, 174, 212], name: 'Brazil' },
                Nigeria: { x: [1960, 1980, 2000, 2020], y: [45, 74, 122, 206], name: 'Nigeria' },
                Bangladesh: { x: [1960, 1980, 2000, 2020], y: [48, 88, 131, 164], name: 'Bangladesh' },
                Russia: { x: [1960, 1980, 2000, 2020], y: [119, 138, 146, 145], name: 'Russian Federation' },
                Mexico: { x: [1960, 1980, 2000, 2020], y: [38, 68, 98, 128], name: 'Mexico' },
            };

            function getTraces(selectedCountry) {
                if (selectedCountry === 'all') {
                    return Object.values(allCountryData).map(country => ({
                        x: country.x,
                        y: country.y,
                        type: 'scatter',
                        mode: 'lines+markers',
                        name: country.name,
                        line: { width: 3 },
                        marker: { size: 6 },
                        hoverlabel: { bgcolor: "#1a202c", font: { color: "white" } }
                    }));
                } else {
                    const country = allCountryData[selectedCountry];
                    return [{
                        x: country.x,
                        y: country.y,
                        type: 'scatter',
                        mode: 'lines+markers',
                        name: country.name,
                        line: { width: 4, color: '#38b2ac' }, // Teal Accent
                        marker: { size: 8, color: '#1a202c' },
                        hoverlabel: { bgcolor: "#1a202c", font: { color: "white" } }
                    }];
                }
            }

            const lineLayout = {
                title: {
                    text: 'Population Growth of Top Countries',
                    font: { size: 18, color: '#1a202c', family: 'Playfair Display, serif' }
                },
                xaxis: { 
                    title: 'Year', 
                    automargin: true,
                    tickfont: { size: 12, color: '#4a5568', family: 'Inter, sans-serif' },
                    gridcolor: '#e2e8f0'
                },
                yaxis: { 
                    title: 'Population (Millions)', 
                    automargin: true,
                    tickfont: { size: 12, color: '#4a5568', family: 'Inter, sans-serif' },
                    gridcolor: '#e2e8f0'
                },
                margin: { t: 60, b: 100, l: 60, r: 30 },
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)',
                font: { family: 'Inter, system-ui, sans-serif', size: 13 },
                legend: {
                    orientation: 'h', 
                    yanchor: 'bottom', 
                    y: -0.3, 
                    xanchor: 'center', 
                    x: 0.5,
                    font: { size: 11, color: '#4a5568' }
                },
                config: { 
                    accessible: true, 
                    responsive: true,
                    displayModeBar: false
                }
            };

            Plotly.newPlot(div, getTraces('all'), lineLayout, lineLayout.config).then(() => div.classList.remove('chart-container-loading'));

            if (countryFilter) {
                countryFilter.addEventListener('change', (event) => {
                    div.classList.add('chart-container-loading');
                    const selectedCountry = event.target.value;
                    Plotly.react(div, getTraces(selectedCountry), lineLayout, lineLayout.config).then(() => div.classList.remove('chart-container-loading'));
                });
            }
        });
    }

    // --- Initialization ---
    setupScrollSpy();
    setupSmoothScrolling();
    loadCharts();

    // Handle window resize for charts
    window.addEventListener('resize', () => {
        const chartDivs = document.querySelectorAll('#income-group-chart, #population-growth-treemap, #population-growth-line-chart');
        chartDivs.forEach(div => {
            if (div.data) {
                Plotly.Plots.resize(div);
            }
        });
    });
});