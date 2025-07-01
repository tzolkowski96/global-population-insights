document.addEventListener('DOMContentLoaded', () => {
    // Ensure page starts at top
    window.scrollTo(0, 0);
    
    const slides = document.querySelectorAll('.slide');
    const navButtons = document.querySelectorAll('.vertical-navigation-bar button');
    const countryFilter = document.getElementById('country-filter');
    let currentSlide = 0;

    // --- Initial Setup ---
    function initializeSlideshow() {
        // Set up the first slide without triggering scroll behavior
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === 0);
            slide.setAttribute('aria-hidden', i !== 0);
        });
        currentSlide = 0;
        updateNavButtons();
        loadCharts();
        setupEventListeners();
        updateURLForSlide(1);
        
        // Ensure we start at the very top to show the header and title
        window.scrollTo(0, 0);
        
        // Handle hash changes after initial load
        handleHashChange();
    }

    // --- Slide Navigation ---
    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
            slide.setAttribute('aria-hidden', i !== index);
        });
        currentSlide = index;
        updateNavButtons();
        updateURLForSlide(index + 1);

        // Scroll to top of content when changing slides
        // For the first slide, scroll to absolute top to show the header; for others, to main content
        if (index === 0) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            // Don't auto-focus on the first slide's heading to keep the header visible
        } else {
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            // Focus on the slide's main heading for accessibility (non-first slides only)
            const activeSlideHeading = slides[index].querySelector('h1, h2');
            if (activeSlideHeading) {
                activeSlideHeading.setAttribute('tabindex', '-1');
                activeSlideHeading.focus();
            }
        }
    }

    window.nextSlide = () => {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    };

    window.previousSlide = () => {
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        showSlide(currentSlide);
    };

    window.jumpToSlide = (slideNumber) => {
        showSlide(slideNumber - 1);
    };

    function updateNavButtons() {
        navButtons.forEach((button, i) => {
            button.classList.toggle('active', i === currentSlide);
            button.setAttribute('aria-pressed', i === currentSlide);
        });
    }

    // --- URL Hashing for Deep Linking ---
    function updateURLForSlide(slideNumber) {
        // Only update hash if it's different to prevent history spam
        if (window.location.hash !== `#slide${slideNumber}`) {
            window.location.hash = `slide${slideNumber}`;
        }
    }

    function handleHashChange() {
        const hash = window.location.hash;
        if (hash) {
            const slideNumber = parseInt(hash.substring(6), 10); // Assumes #slideN format
            if (!isNaN(slideNumber) && slideNumber > 0 && slideNumber <= slides.length) {
                if (currentSlide !== slideNumber -1) { // Only jump if it's a different slide
                    showSlide(slideNumber - 1);
                }
            }
        }
    }

    // --- Chart Loading and Interactivity (Plotly.js) ---
    function loadCharts() {
        // Ensure Plotly is loaded before calling its methods
        if (typeof Plotly === 'undefined') {
            console.error("Plotly.js not loaded. Charts cannot be rendered.");
            // Optionally, display a message to the user in the chart divs
            const chartDivs = document.querySelectorAll('#income-group-chart, #population-growth-treemap, #population-growth-line-chart');
            chartDivs.forEach(div => {
                div.innerHTML = '<p style="color:red; text-align:center; padding-top: 20px;">Error: Chart library not loaded. Cannot display chart.</p>';
                div.classList.remove('chart-container-loading');
            });
            return;
        }

        // Example: Income Group Chart (Bar Chart)
        const incomeGroupChartDiv = document.getElementById('income-group-chart');
        if (incomeGroupChartDiv) {
            Plotly.newPlot(incomeGroupChartDiv, [{
                x: ['Low Income', 'Lower Middle', 'Upper Middle', 'High Income'],
                y: [0.8, 1.5, 1.2, 0.5], // Example CAGR values
                type: 'bar',
                marker: { color: '#005A9C' },
                // Accessibility enhancements for Plotly charts
                hoverlabel: { bgcolor: "white" },
                texttemplate: '%{y:.2f}%', 
                textposition: 'outside'
            }], {
                title: 'Population Growth Rate by Income Group (CAGR %)',
                xaxis: { 
                    title: 'Income Group', 
                    automargin: true,
                    tickfont: { size: 12 }
                },
                yaxis: { 
                    title: 'CAGR %', 
                    automargin: true,
                    tickfont: { size: 12 }
                },
                margin: { t: 60, b: 60, l: 60, r: 30 },
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)',
                font: { family: 'system-ui, -apple-system, sans-serif', size: 12 },
                config: { 
                    accessible: true, 
                    responsive: true,
                    displayModeBar: false
                }
            }).then(function() {
                incomeGroupChartDiv.classList.remove('chart-container-loading');
            }).catch(function(err){
                console.error("Plotly error (Income Chart): ", err);
                incomeGroupChartDiv.innerHTML = '<p style="color:red; text-align:center; padding-top: 20px;">Could not load Income Group chart.</p>';
                incomeGroupChartDiv.classList.remove('chart-container-loading');
            });
        }

        // Example: Population Growth Treemap
        const treemapDiv = document.getElementById('population-growth-treemap');
        if (treemapDiv) {
            Plotly.newPlot(treemapDiv, [{
                type: "treemap",
                labels: ['Asia', 'Africa', 'Europe', 'North America', 'South America', 'Oceania',
                         'Sub-Saharan Africa', 'East Asia & Pacific', 'Europe & Central Asia'],
                parents: ['', '', '', '', '', '', 'Africa', 'Asia', 'Europe'],
                values:  [4700, 1400, 750, 600, 440, 43, 1200, 2300, 700], // Example population numbers (millions)
                marker: {colors: ['#003366', '#005A9C', '#4A90E2', '#7BAFDE', '#A8D8F0', '#CFEAF7', '#004B87', '#2A7ABF', '#609AD4']},
                textinfo: "label+value+percent parent+percent root",
                hoverinfo: 'label+value+percent parent+percent root',
                // Accessibility enhancements
                hoverlabel: { bgcolor: "white" }
            }], {
                title: 'Global Population Distribution & Regional Growth Focus',
                margin: {t: 60, l: 25, r: 25, b: 25},
                paper_bgcolor: 'rgba(0,0,0,0)',
                font: { family: 'system-ui, -apple-system, sans-serif', size: 12 },
                config: { 
                    accessible: true, 
                    responsive: true,
                    displayModeBar: false
                }
            }).then(function(){
                treemapDiv.classList.remove('chart-container-loading');
            }).catch(function(err){
                console.error("Plotly error (Treemap): ", err);
                treemapDiv.innerHTML = '<p style="color:red; text-align:center; padding-top: 20px;">Could not load Treemap chart.</p>';
                treemapDiv.classList.remove('chart-container-loading');
            });
        }

        // Example: Population Growth Line Chart (Filterable)
        const lineChartDiv = document.getElementById('population-growth-line-chart');
        if (lineChartDiv) {
            const allCountryData = {
                China: { x: [1960, 1980, 2000, 2020], y: [667, 981, 1262, 1412], name: 'China' },
                India: { x: [1960, 1980, 2000, 2020], y: [450, 698, 1053, 1380], name: 'India' },
                USA: { x: [1960, 1980, 2000, 2020], y: [180, 227, 282, 331], name: 'USA' },
                Indonesia: { x: [1960, 1980, 2000, 2020], y: [97, 150, 214, 273], name: 'Indonesia' },
                Pakistan: { x: [1960, 1980, 2000, 2020], y: [45, 82, 142, 220], name: 'Pakistan' },
                Brazil: { x: [1960, 1980, 2000, 2020], y: [72, 121, 174, 212], name: 'Brazil' },
                Nigeria: { x: [1960, 1980, 2000, 2020], y: [45, 74, 122, 206], name: 'Nigeria' },
                Bangladesh: { x: [1960, 1980, 2000, 2020], y: [48, 88, 131, 164], name: 'Bangladesh' },
                Russia: { x: [1960, 1980, 2000, 2020], y: [119, 138, 146, 145], name: 'Russian Federation' }, // Updated name
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
                        hoverlabel: { bgcolor: "white" } // Accessibility
                    }));
                } else {
                    const country = allCountryData[selectedCountry];
                    return [{
                        x: country.x,
                        y: country.y,
                        type: 'scatter',
                        mode: 'lines+markers',
                        name: country.name,
                        hoverlabel: { bgcolor: "white" } // Accessibility
                    }];
                }
            }

            const lineLayout = {
                title: 'Population Growth of Top Countries',
                xaxis: { 
                    title: 'Year', 
                    automargin: true,
                    tickfont: { size: 12 }
                },
                yaxis: { 
                    title: 'Population (Millions)', 
                    automargin: true,
                    tickfont: { size: 12 }
                },
                margin: { t: 60, b: 100, l: 60, r: 30 },
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)',
                font: { family: 'system-ui, -apple-system, sans-serif', size: 12 },
                legend: {
                    orientation: 'h', 
                    yanchor: 'bottom', 
                    y: -0.3, 
                    xanchor: 'center', 
                    x: 0.5,
                    font: { size: 11 }
                },
                config: { 
                    accessible: true, 
                    responsive: true,
                    displayModeBar: false
                }
            };

            Plotly.newPlot(lineChartDiv, getTraces('all'), lineLayout, lineLayout.config).then(function(){
                lineChartDiv.classList.remove('chart-container-loading');
            }).catch(function(err){
                console.error("Plotly error (Line Chart): ", err);
                lineChartDiv.innerHTML = '<p style="color:red; text-align:center; padding-top: 20px;">Could not load Line chart.</p>';
                lineChartDiv.classList.remove('chart-container-loading');
            });

            if (countryFilter) {
                countryFilter.addEventListener('change', (event) => {
                    lineChartDiv.classList.add('chart-container-loading'); // Add loading class before react
                    const selectedCountry = event.target.value;
                    Plotly.react(lineChartDiv, getTraces(selectedCountry), lineLayout, lineLayout.config).then(function(){
                        lineChartDiv.classList.remove('chart-container-loading');
                    }).catch(function(err){
                        console.error("Plotly error (Line Chart Update): ", err);
                        lineChartDiv.innerHTML = '<p style="color:red; text-align:center; padding-top: 20px;">Could not update Line chart.</p>';
                        lineChartDiv.classList.remove('chart-container-loading');
                    });
                });
            }
        }
    }

    // --- Event Listeners ---
    function setupEventListeners() {
        // Keyboard navigation for slides
        document.addEventListener('keydown', (event) => {
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT' || event.target.tagName === 'TEXTAREA') {
                return; // Don't interfere with form input
            }
            if (event.key === 'ArrowRight') {
                nextSlide();
            }
            if (event.key === 'ArrowLeft') {
                previousSlide();
            }
        });

        // Handle hash changes for deep linking
        window.addEventListener('hashchange', handleHashChange);

        // Initial check for hash on page load
        handleHashChange(); // Call on load to jump to slide if hash is present
    }

    // --- Start the slideshow ---
    initializeSlideshow();
});
