// API Configuration
const API_BASE_URL = 'http://localhost:5001';

let chartData = [];
const margin = {top: 20, right: 30, bottom: 50, left: 60};

// ============================================
// PAGE NAVIGATION
// ============================================

function showPage(pageName, event) {
  event.preventDefault();
  
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
  });
  
  document.getElementById(pageName).classList.add('active');
  event.target.classList.add('active');

  if (pageName === 'gallery') {
    loadGalleryWithD3();
  }
}

// ============================================
// FETCH LATEST IMAGE
// ============================================

async function fetchLatestImage() {
  try {
    const response = await fetch(`${API_BASE_URL}/gallery`);
    const imagePaths = await response.json();
    
    if (imagePaths && imagePaths.length > 0) {
      imagePaths.sort((a, b) => b.localeCompare(a));
      
      const latestPath = imagePaths[0];
      const imgElement = document.getElementById('phenocam-img');
      const noImageElement = document.getElementById('no-image');
      const imageInfo = document.querySelector('.image-info');
      
      const metadata = parseFilename(latestPath);
      
      imgElement.src = `${API_BASE_URL}${latestPath}`;
      imgElement.style.display = 'block';
      if (noImageElement) noImageElement.style.display = 'none';
      if (imageInfo) imageInfo.style.display = 'block';
      
      document.getElementById('image-date').textContent = metadata.datetime;
      document.getElementById('image-station').textContent = metadata.location;
      
      console.log('✅ Latest image loaded:', latestPath);
    } else {
      console.log('ℹ️ No images in gallery yet');
      const imgElement = document.getElementById('phenocam-img');
      const noImageElement = document.getElementById('no-image');
      if (imgElement) imgElement.style.display = 'none';
      if (noImageElement) noImageElement.style.display = 'block';
    }
  } catch (error) {
    console.error('❌ Error fetching latest image:', error);
    const imgElement = document.getElementById('phenocam-img');
    const noImageElement = document.getElementById('no-image');
    if (imgElement) imgElement.style.display = 'none';
    if (noImageElement) noImageElement.style.display = 'block';
  }
}

async function pollLatestImage() {
  try {
    const res = await fetch(`${API_BASE_URL}/latest`);
    if (!res.ok) return;
    const data = await res.json();
    if (!data || !data.path) return;

    const latestSrc = `${API_BASE_URL}${data.path}`;
    const imgElement = document.getElementById('phenocam-img');
    if (!imgElement) return;

    if (imgElement.src !== latestSrc) {
      const metadata = parseFilename(data.path);
      const imgObj = {
        filename: data.filename,
        src: latestSrc,
        datetime: metadata.datetime,
        location: metadata.location
      };
      setLatestImage(imgObj);
    }
  } catch (err) {
    console.error('Error polling latest image:', err);
  }
}

function setLatestImage(imgObj) {
  if (!imgObj) return;
  try {
    const imgElement = document.getElementById('phenocam-img');
    const noImageElement = document.getElementById('no-image');
    const imageInfo = document.querySelector('.image-info');

    if (imgElement) {
      imgElement.src = imgObj.src;
      imgElement.style.display = 'block';
    }
    if (noImageElement) noImageElement.style.display = 'none';
    if (imageInfo) imageInfo.style.display = 'block';

    const dateEl = document.getElementById('image-date');
    const stationEl = document.getElementById('image-station');
    if (dateEl) dateEl.textContent = imgObj.datetime || imgObj.captured_at || '';
    if (stationEl) stationEl.textContent = imgObj.location || imgObj.station || '';

    console.log('Main image updated from gallery:', imgObj.filename || imgObj.src);
  } catch (err) {
    console.error('Error setting latest image:', err);
  }
}

// ============================================
// PARSE FILENAME
// ============================================

function parseFilename(filename) {
  const name = filename.split('/').pop();
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
    
    return {
      date: date,
      time: time,
      datetime: `${date} ${time}`,
      location: 'APU Position 01'
    };
  }
  
  return {
    date: 'Unknown',
    time: 'Unknown',
    datetime: 'Unknown',
    location: 'APU Position 01'
  };
}

// ============================================
// GALLERY
// ============================================

function loadGalleryWithD3() {
  const galleryGrid = d3.select('#gallery-grid');
  
  galleryGrid.html('<div style="text-align: center; padding: 40px; color: #666;">⏳ Loading images with D3.js...</div>');
  
  console.log('D3 fetching gallery from:', `${API_BASE_URL}/gallery`);
  
  d3.json(`${API_BASE_URL}/gallery`)
    .then(imagePaths => {
      console.log('D3 received images:', imagePaths);
      
      if (!imagePaths || imagePaths.length === 0) {
        galleryGrid.html('<div style="text-align: center; padding: 40px; color: #666;">No images found in the Phenocam folder.</div>');
        return;
      }

      const images = imagePaths.map((path, index) => {
        const metadata = parseFilename(path);
        return {
          id: index + 1,
          filename: path.split('/').pop(),
          src: `${API_BASE_URL}${path}`,
          ...metadata
        };
      });

      images.sort((a, b) => {
        if (a.datetime === 'Unknown' || b.datetime === 'Unknown') return 0;
        return new Date(b.datetime) - new Date(a.datetime);
      });

      galleryGrid.html('');

      const galleryItems = galleryGrid
        .selectAll('.gallery-item')
        .data(images)
        .enter()
        .append('div')
        .attr('class', 'gallery-item')
        .on('click', function(event, d) {
          setLatestImage(d);
          openImageModal(d.src, d.datetime, d.location);
        });

      galleryItems
        .append('img')
        .attr('src', d => d.src)
        .attr('alt', d => d.filename)
        .on('error', function() {
          d3.select(this).attr('src', 'https://via.placeholder.com/250x200/4CAF50/ffffff?text=Image+Not+Found');
        });

      const infoDiv = galleryItems
        .append('div')
        .attr('class', 'gallery-item-info');

      infoDiv
        .append('h4')
        .text(d => `View`);

      infoDiv
        .append('p')
        .style('font-size', '0.9em')
        .style('color', '#666')
        .html(d => `${d.datetime}<br>${d.location}`);

      console.log(`D3 Gallery loaded with ${images.length} images`);
      
      if (images.length > 0) {
        setLatestImage(images[0]);
      }
    })
    .catch(error => {
      console.error('D3 Error loading gallery:', error);
      galleryGrid.html(`
        <div style="text-align: center; padding: 40px; color: #d32f2f;">
          <p>Error loading images from server</p>
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
    
    modal.addEventListener('click', function(event) {
      if (event.target === modal) {
        closeImageModal();
      }
    });
  }
  
  document.getElementById('modalImage').src = src;
  document.getElementById('modalDateTime').textContent = `📅 Captured: ${datetime || 'Unknown'}`;
  document.getElementById('modalLocation').textContent = `📍 Location: ${location || 'Unknown'}`;
  
  modal.style.display = 'block';
  document.body.classList.add('modal-open');
  
  console.log('✅ Modal opened for image:', src);
}

function closeImageModal() {
  const modal = document.getElementById('imageModal');
  if (modal) {
    modal.style.display = 'none';
    document.body.classList.remove('modal-open');
    console.log('✅ Modal closed');
  }
}

document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    closeImageModal();
  }
});

window.onclick = function(event) {
  const modal = document.getElementById('imageModal');
  if (event.target == modal) {
    closeImageModal();
  }
};

// ============================================
// LOAD NDVI DATA - SIMPLIFIED
// ============================================

function loadNDVIData() {
  console.log('📊 Loading NDVI plot data...');

  const parseDate = d3.timeParse("%Y_%m_%d");

  d3.json('/Plots/ndvi_plot.json')
    .then(data => {
      console.log('✅ Raw NDVI data loaded:', data);

      // Validate structure
      if (!data.x || !data.y || data.x.length !== data.y.length) {
        throw new Error("Invalid NDVI JSON structure (x/y mismatch)");
      }

      // Map JSON → chartData
      chartData = data.x.map((d, i) => {
        const parsedDate = parseDate(d);

        if (!parsedDate || isNaN(data.y[i])) return null;

        return {
          date: parsedDate,
          ndvi: data.y[i]
        };
      }).filter(d => d !== null);

      // Sort chronologically (important for time series)
      chartData.sort((a, b) => a.date - b.date);

      console.log(`✅ Loaded ${chartData.length} NDVI points`);
      console.log('📊 First:', chartData[0]);
      console.log('📊 Last:', chartData[chartData.length - 1]);

      if (chartData.length === 0) {
        document.getElementById('chart').innerHTML =
          '<div class="loading">📊 No valid NDVI data found</div>';
        return;
      }

      // Update visuals
      updateChart();
      updateMetricsFromData();
    })
    .catch(error => {
      console.error('❌ NDVI load error:', error);

      document.getElementById('chart').innerHTML = `
        <div class="loading" style="color:#e53935;">
          ❌ Failed to load NDVI plot data<br>
          <span style="font-size:0.9em">${error.message}</span>
        </div>
      `;
    });
}

function load_ndviPng(){
  d3.image('./Plots/ndvi_plot.png')

}
// ============================================
// UPDATE METRICS
// ============================================

function updateMetricsFromData() {
  if (chartData.length === 0) return;
  
  const latest = chartData[chartData.length - 1];
  document.getElementById('ndvi-value').textContent = latest.ndvi.toFixed(3);
  
  const avgNDVI = chartData.reduce((sum, d) => sum + d.ndvi, 0) / chartData.length;
  const estimatedBrightness = Math.round(127 + (avgNDVI * 100));
  document.getElementById('brightness-value').textContent = Math.max(0, Math.min(255, estimatedBrightness));
  
  console.log(`✅ Metrics updated - Latest NDVI: ${latest.ndvi.toFixed(3)}, Avg NDVI: ${avgNDVI.toFixed(3)}`);
}

// ============================================
// UPDATE CHART
// ============================================

function updateChart() {
  if (chartData.length === 0) {
    document.getElementById('chart').innerHTML = '<div class="loading">⏳ Loading NDVI data...</div>';
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

  svg.append('g')
    .attr('class', 'grid')
    .attr('opacity', 0.1)
    .call(d3.axisLeft(y)
      .tickSize(-width)
      .tickFormat('')
    );

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
    .on('mouseover', function(event, d) {
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
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 30) + 'px');
    })
    .on('mouseout', function() {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('r', 4);
      
      d3.selectAll('.chart-tooltip').remove();
    });

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

  console.log('✅ Chart rendered with', chartData.length, 'data points');
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('🌿 Phenocam Dashboard Initialized');
  console.log('Backend URL:', API_BASE_URL);
  
  // Load NDVI data
  loadNDVIData();
  
  // Load latest image
  fetchLatestImage();
  
  // Poll for latest image every 30s
  pollLatestImage();
  setInterval(pollLatestImage, 30000);
});