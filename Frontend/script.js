// API Configuration
const API_BASE_URL = 'http://localhost:5002';  // Changed to match your Flask port

let chartData = [];
const margin = { top: 20, right: 30, bottom: 50, left: 60 };

// ============================================
// PAGE NAVIGATION
// ============================================

function showPage(pageName, event) {
  event.preventDefault();

  // Hide all pages
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });

  // Remove active class from all nav links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
  });

  // Show selected page
  document.getElementById(pageName).classList.add('active');

  // Add active class to clicked link
  event.target.classList.add('active');

  // Load gallery if switching to gallery page
  if (pageName === 'gallery') {
    loadGalleryWithD3();
  }
}

// ============================================
// FETCH DATA FROM BACKEND
// ============================================

async function fetchTimeSeriesData() {
  try {
    const data = await d3.json(`${API_BASE_URL}/metrics/timeseries`);

    if (!data || data.length === 0) {
      document.getElementById('chart').innerHTML =
        '<div class="loading">📊 No data yet. Upload images to see trends!</div>';
      return;
    }

    // Convert to chart format
    chartData = data.map(item => ({
      date: new Date(item.date),
      ndvi: +item.ndvi
    }));

    updateChart();
    updateMetricsFromData();

    console.log('✅ Time series loaded:', chartData.length, 'data points');

  } catch (error) {
    console.error('❌ Error fetching time series:', error);
    document.getElementById('chart').innerHTML =
      '<div class="loading">❌ Error loading data. Make sure Flask backend is running!</div>';
  }
}


async function fetchLatestImage() {
  try {
    // Use the dedicated /latest endpoint
    const response = await fetch(`${API_BASE_URL}/latest`);
    const data = await response.json();

    if (data && data.path && data.filename) {
      const imgElement = document.getElementById('phenocam-img');
      const noImageElement = document.getElementById('no-image');
      const imageInfo = document.querySelector('.image-info');

      // Parse filename to get metadata
      const metadata = parseFilename(data.filename);

      // Show image with full URL
      imgElement.src = `${API_BASE_URL}${data.path}`;
      imgElement.style.display = 'block';
      if (noImageElement) noImageElement.style.display = 'none';
      if (imageInfo) imageInfo.style.display = 'block';

      // Update image info with parsed metadata
      document.getElementById('image-date').textContent = metadata.datetime;
      document.getElementById('image-station').textContent = metadata.location;

      console.log('✅ Latest image loaded:', data.filename);
      console.log('📅 Captured at:', metadata.datetime);
      console.log('📍 Location:', metadata.location);
    } else {
      console.log('ℹ️ No images available in Phenocamdata folder');
      const imgElement = document.getElementById('phenocam-img');
      const noImageElement = document.getElementById('no-image');
      if (imgElement) imgElement.style.display = 'none';
      if (noImageElement) {
        noImageElement.style.display = 'block';
        noImageElement.textContent = '📷 No images available yet';
      }
    }
  } catch (error) {
    console.error('❌ Error fetching latest image:', error);
    const imgElement = document.getElementById('phenocam-img');
    const noImageElement = document.getElementById('no-image');
    if (imgElement) imgElement.style.display = 'none';
    if (noImageElement) {
      noImageElement.style.display = 'block';
      noImageElement.textContent = '❌ Error loading image. Check if Flask is running.';
    }
  }
}

// ============================================
// LOAD IMAGE GALLERY WITH D3.JS
// ============================================

// Parse filename to extract metadata
function parseFilename(filename) {
  // Extract just the filename from the full path
  const name = filename.split('/').pop();

  // Expected format: APU_pos_01_2025_07_28_13_38_47_color.jpg
  const parts = name.replace(/\.(jpg|jpeg|png|gif)$/i, '').split('_');

  if (parts.length >= 8) {
    const year = parts[3];
    const month = parts[4];
    const day = parts[5];
    const hour = parts[6] || '00';
    const minute = parts[7] || '00';
    const second = parts[8] || '00';

    const date = `${year}-${month}-${day}`;
    const time = `${hour}:${minute}:${second}`;

    // Determine season based on month (Indian seasons)
    let bandType = 'Color View'; // Default
    
    if (name.toLowerCase().includes('_ndvi')) {
      bandType = 'NDVI View';
    } else if (name.toLowerCase().includes('_ir') || name.toLowerCase().includes('_nir')) {
      bandType = 'IR View';
    } else if (name.toLowerCase().includes('_color')) {
      bandType = 'Color View';
    } else if (name.toLowerCase().includes('_rgb')) {
      bandType = 'RGB View';
    }

    return {
      date: date,
      time: time,
      datetime: `${date} ${time}`,
      band: bandType,
      location: 'APU Position 01'
    };
  }

  return {
    date: 'Unknown',
    time: 'Unknown',
    datetime: 'Unknown',
    band: 'Unknown',
    location: 'APU Position 01'
  };
}

function loadGalleryWithD3() {
  const galleryGrid = d3.select('#gallery-grid');

  // Show loading message
  galleryGrid.html('<div style="text-align: center; padding: 40px; color: #666;">⏳ Loading images with D3.js...</div>');

  console.log('📡 D3 fetching gallery from:', `${API_BASE_URL}/gallery`);

  // Use D3 to fetch JSON data
  d3.json(`${API_BASE_URL}/gallery`)
    .then(imagePaths => {
      console.log('✅ D3 received images:', imagePaths);

      if (!imagePaths || imagePaths.length === 0) {
        galleryGrid.html('<div style="text-align: center; padding: 40px; color: #666;">📷 No images found in the Phenocam folder.</div>');
        return;
      }

      // Parse all images and create data array
      const images = imagePaths.map((path, index) => {
        const metadata = parseFilename(path);
        return {
          id: index + 1,
          filename: path.split('/').pop(),
          src: `${API_BASE_URL}${path}`,
          ...metadata
        };
      });

      // Sort images by date (newest first)
      images.sort((a, b) => {
        if (a.datetime === 'Unknown' || b.datetime === 'Unknown') return 0;
        return new Date(b.datetime) - new Date(a.datetime);
      });

      // Clear loading message
      galleryGrid.html('');

      // Create gallery items using D3
      const galleryItems = galleryGrid
        .selectAll('.gallery-item')
        .data(images)
        .enter()
        .append('div')
        .attr('class', 'gallery-item')
        .on('click', function (event, d) {
          openImageModal(d.src, d.datetime, d.location);
        });

      // Add images
      galleryItems
        .append('img')
        .attr('src', d => d.src)
        .attr('alt', d => d.filename)
        .on('error', function () {
          d3.select(this).attr('src', 'https://via.placeholder.com/250x200/4CAF50/ffffff?text=Image+Not+Found');
        });

      // Add info container
      const infoDiv = galleryItems
        .append('div')
        .attr('class', 'gallery-item-info');

      // Add season title
      infoDiv
        .append('h4')
        .text(d => d.band);

      // Add metadata
      infoDiv
        .append('p')
        .style('font-size', '0.9em')
        .style('color', '#666')
        .html(d => `${d.datetime}<br>${d.location}`);

      console.log(`✅ D3 Gallery loaded with ${images.length} images`);
    })
    .catch(error => {
      console.error('❌ D3 Error loading gallery:', error);
      galleryGrid.html(`
        <div style="text-align: center; padding: 40px; color: #d32f2f;">
          <p>❌ Error loading images from server</p>
          <p style="font-size: 0.9em; margin-top: 10px;">Make sure Flask backend is running on port 5001</p>
          <p style="font-size: 0.8em; color: #666; margin-top: 10px;">Error: ${error.message}</p>
        </div>
      `);
    });
}

// ============================================
// IMAGE MODAL
// ============================================

function openImageModal(src, datetime, location) {
  // Create modal if it doesn't exist
  let modal = document.getElementById('imageModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'imageModal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close" onclick="closeImageModal()">&times;</span>
        <img id="modalImage" src="" alt="Full size image">
        <div class="modal-info">
          <p id="modalDateTime"></p>
          <p id="modalLocation"></p>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  // Set modal content
  document.getElementById('modalImage').src = src;
  document.getElementById('modalDateTime').textContent = `Captured: ${datetime}`;
  document.getElementById('modalLocation').textContent = `Location: ${location}`;

  // Show modal
  modal.style.display = 'block';
}

function closeImageModal() {
  const modal = document.getElementById('imageModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Close modal when clicking outside
window.onclick = function (event) {
  const modal = document.getElementById('imageModal');
  if (event.target == modal) {
    modal.style.display = 'none';
  }
}

// ============================================
// CHART FUNCTIONS
// ============================================
function updateChart() {
  if (chartData.length === 0) {
    document.getElementById('chart').innerHTML = '<div class="loading">📊 Loading data from backend...</div>';
    return;
  }

  const chartDiv = document.getElementById('chart');
  chartDiv.innerHTML = '';

  const width = chartDiv.clientWidth - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const svg = d3.select('#chart')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scaleTime()
    .domain(d3.extent(chartData, d => d.date))
    .range([0, width]);

  const yMin = d3.min(chartData, d => d.ndvi || 0);
  const yMax = d3.max(chartData, d => d.ndvi || 0);
  const yPadding = (yMax - yMin) * 0.1 || 0.1;

  const y = d3.scaleLinear()
    .domain([yMin - yPadding, yMax + yPadding])
    .range([height, 0]);

  // Add gradient for line
  const gradient = svg.append('defs')
    .append('linearGradient')
    .attr('id', 'line-gradient')
    .attr('gradientUnits', 'userSpaceOnUse')
    .attr('x1', 0)
    .attr('x2', width)
    .attr('y1', 0)
    .attr('y2', 0);

  gradient.append('stop')
    .attr('offset', '0%')
    .attr('stop-color', '#667eea');

  gradient.append('stop')
    .attr('offset', '100%')
    .attr('stop-color', '#764ba2');

  // Add gridlines
  svg.append('g')
    .attr('class', 'grid')
    .attr('opacity', 0.1)
    .call(d3.axisLeft(y)
      .tickSize(-width)
      .tickFormat('')
    );

  // Area under the line
  const area = d3.area()
    .x(d => x(d.date))
    .y0(height)
    .y1(d => y(d.ndvi))
    .curve(d3.curveMonotoneX);

  svg.append('path')
    .datum(chartData)
    .attr('fill', 'url(#line-gradient)')
    .attr('fill-opacity', 0.15)
    .attr('d', area);

  // NDVI Line
  const ndviLine = d3.line()
    .x(d => x(d.date))
    .y(d => y(d.ndvi))
    .curve(d3.curveMonotoneX);

  svg.append('path')
    .datum(chartData)
    .attr('fill', 'none')
    .attr('stroke', 'url(#line-gradient)')
    .attr('stroke-width', 3)
    .attr('d', ndviLine);

  // Add interactive dots
  svg.selectAll('.dot')
    .data(chartData)
    .enter()
    .append('circle')
    .attr('class', 'dot')
    .attr('cx', d => x(d.date))
    .attr('cy', d => y(d.ndvi))
    .attr('r', 4)
    .attr('fill', '#667eea')
    .attr('stroke', 'white')
    .attr('stroke-width', 2)
    .style('cursor', 'pointer')
    .on('mouseover', function (event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('r', 6);

      d3.select('body')
        .append('div')
        .attr('class', 'chart-tooltip')
        .html(`
          <strong>Date:</strong> ${d.date.toLocaleDateString()}<br>
          <strong>NDVI:</strong> ${d.ndvi.toFixed(4)}
        `)
        .style('position', 'absolute')
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 30) + 'px');
    })
    .on('mouseout', function () {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('r', 4);

      d3.selectAll('.chart-tooltip').remove();
    });

  // Axes
  svg.append('g')
    .attr('class', 'axis')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll('text')
    .style('font-size', '12px')
    .attr('transform', 'rotate(-45)')
    .style('text-anchor', 'end');

  svg.append('g')
    .attr('class', 'axis')
    .call(d3.axisLeft(y).ticks(8))
    .selectAll('text')
    .style('font-size', '12px');

  // Labels
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', height + 50)
    .attr('text-anchor', 'middle')
    .style('font-size', '14px')
    .style('font-weight', '600')
    .style('fill', '#555')
    .text('Date');

  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height / 2)
    .attr('y', -45)
    .attr('text-anchor', 'middle')
    .style('font-size', '14px')
    .style('font-weight', '600')
    .style('fill', '#555')
    .text('NDVI (Normalized Difference Vegetation Index)');

  console.log('✅ Chart rendered with', chartData.length, 'points');
}

// ============================================
// UPDATE KEY METRICS FROM CHART DATA
// ============================================

function updateMetricsFromData() {
  if (chartData.length === 0) {
    document.getElementById('ndvi-value').textContent = '0.000';
    document.getElementById('brightness-value').textContent = '0';
    return;
  }

  // Get the latest NDVI value
  const latest = chartData[chartData.length - 1];
  document.getElementById('ndvi-value').textContent = latest.ndvi.toFixed(3);

  // Calculate average NDVI
  const avgNDVI = chartData.reduce((sum, d) => sum + d.ndvi, 0) / chartData.length;

  // Estimate brightness based on NDVI (rough approximation)
  // Higher NDVI = more vegetation = typically higher brightness in green channel
  const estimatedBrightness = Math.round(127 + (avgNDVI * 100));
  document.getElementById('brightness-value').textContent = Math.max(0, Math.min(255, estimatedBrightness));

  console.log(`✅ Metrics updated - Latest NDVI: ${latest.ndvi.toFixed(3)}, Avg NDVI: ${avgNDVI.toFixed(3)}, Brightness: ${estimatedBrightness}`);
}
// ============================================
//Export chart data as CSV
// ============================================
function exportChartData() {
  window.location.href = "/download-csv";
}

// ============================================
// LOAD ALL DATA FROM BACKEND
// ============================================

async function loadAllData() {
  console.log('📡 Loading data from Flask backend at:', API_BASE_URL);
  document.getElementById('chart').innerHTML = '<div class="loading">⏳ Loading from backend...</div>';

  try {
    // Try to fetch metrics, but don't fail if endpoints don't exist
    try {
      await LatestMetfetchrics();
    } catch (e) {
      console.log('ℹ️ Metrics endpoint not available');
    }

    try {
      await fetchTimeSeriesData();
    } catch (e) {
      console.log('ℹ️ Time series endpoint not available, generating sample data');
      generateSampleData();
    }

    try {
      await fetchLatestImage();
    } catch (e) {
      console.log('ℹ️ Images endpoint not available');
    }

    console.log('✅ Data loading complete!');
  } catch (error) {
    console.error('❌ Error loading data:', error);
    generateSampleData(); // Fallback to sample data
  }
}

// ============================================
// EVENT LISTENERS
// ============================================

window.addEventListener('resize', () => {
  if (chartData.length > 0 && document.getElementById('dashboard').classList.contains('active')) {
    updateChart();
  }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  console.log('🌿 Phenocam Dashboard Initialized');
  console.log('🔌 Backend URL:', API_BASE_URL);

  // Load initial data
  loadAllData();
});