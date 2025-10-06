// Use configuration from config.js
const CONFIG = window.APP_CONFIG;

// Global state
let userNFTs = [];
let selectedNFTs = [];
let collageOrder = [];

// DOM elements
const walletInput = document.getElementById('walletAddress');
const fetchNFTsBtn = document.getElementById('fetchNFTs');
const loadingDiv = document.getElementById('loading');
const nftSelectionDiv = document.getElementById('nftSelection');
const nftGrid = document.getElementById('nftGrid');
const selectionCount = document.getElementById('selectionCount');
const proceedBtn = document.getElementById('proceedToCollage');
const collageSection = document.getElementById('collageSection');
const collageGrid = document.getElementById('collageGrid');
const selectedNFTsDiv = document.getElementById('selectedNFTs');
const generateCollageBtn = document.getElementById('generateCollage');
const downloadPNGBtn = document.getElementById('downloadPNG');
const downloadGIFBtn = document.getElementById('downloadGIF');
const errorMessage = document.getElementById('errorMessage');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
});

function setupEventListeners() {
    fetchNFTsBtn.addEventListener('click', fetchUserNFTs);
    proceedBtn.addEventListener('click', proceedToCollage);
    generateCollageBtn.addEventListener('click', generateCollage);
    downloadPNGBtn.addEventListener('click', () => downloadCollage('png'));
    downloadGIFBtn.addEventListener('click', () => downloadCollage('gif'));
    
    // Allow Enter key to fetch NFTs
    walletInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            fetchUserNFTs();
        }
    });
}

async function fetchUserNFTs() {
    console.log('fetchUserNFTs called');
    const walletAddress = walletInput.value.trim();
    console.log('Wallet address:', walletAddress);
    
    if (!walletAddress) {
        showError(CONFIG.MESSAGES.NO_WALLET);
        return;
    }
    
    if (!isValidEthereumAddress(walletAddress)) {
        showError(CONFIG.MESSAGES.INVALID_WALLET);
        return;
    }
    
    showLoading(true);
    hideError();
    
    try {
        const fetchUrl = `${CONFIG.ALCHEMY_API_URL}?owner=${walletAddress}&contractAddresses[]=${CONFIG.CONTRACT_ADDRESS}&withMetadata=true`;
        console.log('Fetching from URL:', fetchUrl);
        
        const response = await fetch(fetchUrl);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.ownedNfts && data.ownedNfts.length > 0) {
            userNFTs = data.ownedNfts.map(nft => {
                // Try multiple image sources
                let imageUrl = nft.image?.originalUrl || 
                              nft.image?.pngUrl || 
                              nft.image?.url ||
                              nft.media?.[0]?.gateway ||
                              nft.media?.[0]?.raw ||
                              nft.rawMetadata?.image;
                
                // Check for animation URLs
                let animationUrl = nft.animationUrl || 
                                  nft.media?.[0]?.gateway ||
                                  nft.rawMetadata?.animation_url;
                
                // If no image URL found, try to construct one
                if (!imageUrl && nft.tokenId) {
                    // Try common IPFS patterns
                    imageUrl = `https://ipfs.io/ipfs/${nft.tokenId}`;
                }
                
                // Determine if NFT is animated - check both image and animation URLs for GIF
                const isAnimated = !!(
                    (imageUrl && (imageUrl.toLowerCase().includes('.gif') || imageUrl.toLowerCase().includes('gif'))) ||
                    (animationUrl && (
                        animationUrl.toLowerCase().includes('.gif') || 
                        animationUrl.toLowerCase().includes('.mp4') || 
                        animationUrl.toLowerCase().includes('.webm') ||
                        animationUrl.toLowerCase().includes('.mov')
                    ))
                );
                
                console.log(`NFT ${nft.tokenId}:`, {
                    name: nft.name,
                    imageUrl,
                    animationUrl,
                    isAnimated
                });
                
                return {
                    tokenId: nft.tokenId,
                    name: nft.name || `NODES #${nft.tokenId}`,
                    image: imageUrl,
                    animationUrl: animationUrl,
                    isAnimated: isAnimated,
                    metadata: nft.metadata,
                    rawMetadata: nft.rawMetadata
                };
            });
            
            displayNFTs();
            showNFTSelection();
        } else {
            showError(CONFIG.MESSAGES.NO_NFTS);
        }
    } catch (error) {
        console.error('Error fetching NFTs:', error);
        showError(CONFIG.MESSAGES.FETCH_ERROR);
    } finally {
        showLoading(false);
    }
}

function isValidEthereumAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function displayNFTs() {
    nftGrid.innerHTML = '';
    
    userNFTs.forEach((nft, index) => {
        const nftElement = createNFTElement(nft, index);
        nftGrid.appendChild(nftElement);
    });
}

function createNFTElement(nft, index) {
    const nftDiv = document.createElement('div');
    nftDiv.className = 'nft-item';
    nftDiv.dataset.index = index;
    
    const img = document.createElement('img');
    
    // Use proxy for external images to avoid CORS issues
    if (nft.image) {
        if (nft.image.startsWith('data:') || nft.image.startsWith('/') || nft.image.startsWith(window.location.origin)) {
            img.src = nft.image;
        } else {
            // Try proxy first, fallback to direct load
            img.src = `/proxy/${encodeURIComponent(nft.image)}`;

            // Add error handler that tries direct load as fallback
            img.onerror = function() {
                console.log(`Proxy failed for ${nft.image}, trying direct load`);
                // Try loading directly (might work for some CORS policies)
                const directImg = new Image();
                directImg.onload = () => {
                    img.src = nft.image;
                };
                directImg.onerror = () => {
                    // Show error placeholder
                    this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmM2YzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkVycm9yPC90ZXh0Pjwvc3ZnPg==';
                };
                directImg.src = nft.image;
            };
        }
    } else {
        img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmM2YzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
    }
    
    const infoDiv = document.createElement('div');
    infoDiv.className = 'nft-info';
    
    const nameDiv = document.createElement('div');
    nameDiv.className = 'nft-name';
    nameDiv.textContent = nft.name;
    
    const tokenIdDiv = document.createElement('div');
    tokenIdDiv.className = 'nft-token-id';
    tokenIdDiv.textContent = `Token ID: ${nft.tokenId}${nft.isAnimated ? ' (Animated)' : ''}`;
    
    // Add animation indicator
    if (nft.isAnimated) {
        const animationIndicator = document.createElement('div');
        animationIndicator.className = 'animation-indicator';
        animationIndicator.textContent = '🎬';
        animationIndicator.title = 'This NFT is animated';
        infoDiv.appendChild(animationIndicator);
    }
    
    infoDiv.appendChild(nameDiv);
    infoDiv.appendChild(tokenIdDiv);
    
    nftDiv.appendChild(img);
    nftDiv.appendChild(infoDiv);
    
    nftDiv.addEventListener('click', () => toggleNFTSelection(index));
    
    return nftDiv;
}

function toggleNFTSelection(index) {
    const nftElement = document.querySelector(`[data-index="${index}"]`);
    const nft = userNFTs[index];
    
    if (selectedNFTs.includes(index)) {
        // Remove from selection
        selectedNFTs = selectedNFTs.filter(i => i !== index);
        nftElement.classList.remove('selected');
    } else {
        // Add to selection (max 8)
        if (selectedNFTs.length < 8) {
            selectedNFTs.push(index);
            nftElement.classList.add('selected');
        } else {
            showError('You can select maximum 8 NFTs');
            return;
        }
    }
    
    updateSelectionUI();
}

function updateSelectionUI() {
    selectionCount.textContent = `${selectedNFTs.length} NFTs selected`;
    proceedBtn.disabled = selectedNFTs.length < 2;
}

function proceedToCollage() {
    if (selectedNFTs.length < 2) {
        showError('Please select at least 2 NFTs');
        return;
    }
    
    collageOrder = [...selectedNFTs];
    generateCollageLayout();
    showCollageSection();
}

function generateCollageLayout() {
    collageGrid.innerHTML = '';
    
    // Create 3x3 grid (9 slots total)
    for (let i = 0; i < 9; i++) {
        const slot = document.createElement('div');
        slot.className = 'collage-slot';
        slot.dataset.position = i;
        
        if (i === 0) {
            // First slot is always the stable logo
            slot.classList.add('stable-logo');
            const logoImg = document.createElement('img');
            logoImg.src = 'logo.png';
            logoImg.alt = 'Logo';
            logoImg.onerror = function() {
                // Fallback to text if logo fails to load
                slot.innerHTML = '<div>STABLE LOGO</div>';
            };
            slot.appendChild(logoImg);
        } else {
            // Fill remaining slots with selected NFTs or stable logo
            const nftIndex = i - 1;
            if (nftIndex < collageOrder.length) {
                const nft = userNFTs[collageOrder[nftIndex]];
                const img = document.createElement('img');
                
                // Use proxy for external images to avoid CORS issues
                if (nft.image) {
                    if (nft.image.startsWith('data:') || nft.image.startsWith('/') || nft.image.startsWith(window.location.origin)) {
                        img.src = nft.image;
                    } else {
                        // Try proxy first, fallback to direct load
                        img.src = `/proxy/${encodeURIComponent(nft.image)}`;

                        // Add error handler that tries direct load as fallback
                        img.onerror = function() {
                            console.log(`Collage proxy failed for ${nft.image}, trying direct load`);
                            // Try loading directly (might work for some CORS policies)
                            const directImg = new Image();
                            directImg.onload = () => {
                                img.src = nft.image;
                            };
                            directImg.onerror = () => {
                                // Show error placeholder - will be handled by canvas drawing
                                img.style.display = 'none';
                            };
                            directImg.src = nft.image;
                        };
                    }
                } else {
                    img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmM2YzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
                }
                
                img.alt = nft.name;
                slot.appendChild(img);
            } else {
                // Fill remaining slots with logo image
                const logoImg = document.createElement('img');
                logoImg.src = 'logo.png';
                logoImg.alt = 'Logo';
                logoImg.onerror = function() {
                    // Fallback to text if logo fails to load
                    slot.innerHTML = '<div class="placeholder">STABLE LOGO</div>';
                };
                slot.appendChild(logoImg);
            }
        }
        
        collageGrid.appendChild(slot);
    }
    
    // Update selected NFTs display for reordering
    updateSelectedNFTsDisplay();
}

function updateSelectedNFTsDisplay() {
    selectedNFTsDiv.innerHTML = '';
    
    collageOrder.forEach((nftIndex, orderIndex) => {
        const nft = userNFTs[nftIndex];
        const nftDiv = document.createElement('div');
        nftDiv.className = 'selected-nft-item';
        nftDiv.draggable = true;
        nftDiv.dataset.orderIndex = orderIndex;
        
        const img = document.createElement('img');
        
        // Use proxy for external images to avoid CORS issues
        if (nft.image) {
            if (nft.image.startsWith('data:') || nft.image.startsWith('/') || nft.image.startsWith(window.location.origin)) {
                img.src = nft.image;
            } else {
                // Try proxy first, fallback to direct load
                img.src = `/proxy/${encodeURIComponent(nft.image)}`;

                // Add error handler that tries direct load as fallback
                img.onerror = function() {
                    console.log(`Selected NFT proxy failed for ${nft.image}, trying direct load`);
                    // Try loading directly (might work for some CORS policies)
                    const directImg = new Image();
                    directImg.onload = () => {
                        img.src = nft.image;
                    };
                    directImg.onerror = () => {
                        // Show error placeholder
                        this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmM2YzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkVycm9yPC90ZXh0Pjwvc3ZnPg==';
                    };
                    directImg.src = nft.image;
                };
            }
        } else {
            img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmM2YzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
        }
        
        img.alt = nft.name;
        
        const dragHandle = document.createElement('div');
        dragHandle.className = 'drag-handle';
        dragHandle.textContent = '⋮⋮';
        
        nftDiv.appendChild(img);
        nftDiv.appendChild(dragHandle);
        
        // Add drag and drop functionality
        nftDiv.addEventListener('dragstart', handleDragStart);
        nftDiv.addEventListener('dragover', handleDragOver);
        nftDiv.addEventListener('dragenter', handleDragEnter);
        nftDiv.addEventListener('dragleave', handleDragLeave);
        nftDiv.addEventListener('drop', handleDrop);
        nftDiv.addEventListener('dragend', handleDragEnd);
        
        selectedNFTsDiv.appendChild(nftDiv);
    });
}

// Drag and drop functionality
let draggedElement = null;
let draggedIndex = null;

function handleDragStart(e) {
    draggedElement = e.target.closest('.selected-nft-item');
    draggedIndex = parseInt(draggedElement.dataset.orderIndex);
    draggedElement.style.opacity = '0.5';
    draggedElement.style.transform = 'scale(0.95)';
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
    e.preventDefault();
    const target = e.target.closest('.selected-nft-item');
    if (target && target !== draggedElement) {
        target.style.borderColor = '#667eea';
        target.style.transform = 'scale(1.05)';
    }
}

function handleDragLeave(e) {
    const target = e.target.closest('.selected-nft-item');
    if (target && target !== draggedElement) {
        target.style.borderColor = '#e2e8f0';
        target.style.transform = 'scale(1)';
    }
}

function handleDrop(e) {
    e.preventDefault();
    
    const target = e.target.closest('.selected-nft-item');
    if (target && target !== draggedElement && draggedIndex !== null) {
        const targetIndex = parseInt(target.dataset.orderIndex);
        
        // Swap positions in collageOrder array
        [collageOrder[draggedIndex], collageOrder[targetIndex]] = [collageOrder[targetIndex], collageOrder[draggedIndex]];
        
        // Regenerate the layout
        generateCollageLayout();
    }
    
    // Reset all styles
    document.querySelectorAll('.selected-nft-item').forEach(item => {
        item.style.borderColor = '#e2e8f0';
        item.style.transform = 'scale(1)';
    });
}

function handleDragEnd(e) {
    if (draggedElement) {
        draggedElement.style.opacity = '1';
        draggedElement.style.transform = 'scale(1)';
    }
    draggedElement = null;
    draggedIndex = null;
}

async function generateCollage() {
    try {
        showError('Generating collage...');
        
        // Validate inputs
        if (!collageOrder || collageOrder.length === 0) {
            showError('No NFTs selected for collage generation');
            return;
        }
        
        if (!userNFTs || userNFTs.length === 0) {
            showError('No NFTs loaded. Please fetch NFTs first.');
            return;
        }
        
        console.log('Generating collage with order:', collageOrder);
        console.log('Selected NFTs:', collageOrder.map(i => userNFTs[i]));
        console.log('Total user NFTs:', userNFTs.length);
        
        // Create canvas for collage
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
            throw new Error('Could not get canvas context');
        }
        
        // Set canvas size (3x3 grid, each cell 200x200)
        const cellSize = 200;
        const canvasSize = cellSize * 3;
        canvas.width = canvasSize;
        canvas.height = canvasSize;
        
        console.log(`Canvas created: ${canvasSize}x${canvasSize}`);
        
        // Fill background with dark theme color
        ctx.fillStyle = '#1e1e2f'; // Dark card background
        ctx.fillRect(0, 0, canvasSize, canvasSize);

        // Draw stable logo in top-left (position 0)
        console.log('Drawing stable logo...');
        await drawStableLogo(ctx, 0, 0, cellSize);
        
        // Draw selected NFTs in remaining positions
        console.log('Drawing NFTs...');
        for (let i = 1; i < 9; i++) {
            const nftIndex = i - 1;
            const row = Math.floor(i / 3);
            const col = i % 3;
            const x = col * cellSize;
            const y = row * cellSize;
            
            console.log(`Position ${i}: nftIndex=${nftIndex}, row=${row}, col=${col}, x=${x}, y=${y}`);
            
            if (nftIndex < collageOrder.length) {
                const nft = userNFTs[collageOrder[nftIndex]];
                console.log(`Drawing NFT at position ${i}:`, nft);
                await drawNFTImage(ctx, nft, x, y, cellSize);
            } else {
                // Fill remaining slots with stable logo
                console.log(`Filling position ${i} with stable logo`);
                await drawStableLogo(ctx, x, y, cellSize);
            }
        }
        
        console.log('All images drawn');
        
        // Draw white grid lines on TOP of NFTs for maximum visibility
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 8; // Very thick lines that will be visible
        
        for (let i = 1; i < 3; i++) {
            // Vertical lines at 1/3 and 2/3 positions
            ctx.beginPath();
            ctx.moveTo(i * cellSize, 0);
            ctx.lineTo(i * cellSize, canvasSize);
            ctx.stroke();
            
            // Horizontal lines at 1/3 and 2/3 positions
            ctx.beginPath();
            ctx.moveTo(0, i * cellSize);
            ctx.lineTo(canvasSize, i * cellSize);
            ctx.stroke();
        }
        
        // Draw white border around entire collage
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 10; // Extra thick outer border
        ctx.strokeRect(0, 0, canvasSize, canvasSize);
        
        // Store the generated canvas for download
        window.generatedCanvas = canvas;
        
        // Update preview
        updateCollagePreview(canvas);
        
        hideError();
        showError('Collage generated successfully! You can now download it.');
        
    } catch (error) {
        console.error('Error generating collage:', error);
        console.error('Error stack:', error.stack);
        showError(`Failed to generate collage: ${error.message}`);
    }
}

async function drawStableLogo(ctx, x, y, size) {
    return new Promise((resolve) => {
        const img = new Image();
        
        img.onload = function() {
            try {
                // Draw the logo image scaled to fit the cell
                ctx.drawImage(img, x, y, size, size);
                console.log('Successfully drew logo image');
                resolve();
            } catch (error) {
                console.error('Error drawing logo:', error);
                // Fallback to gradient background if logo fails
                drawLogoFallback(ctx, x, y, size);
                resolve();
            }
        };
        
        img.onerror = function() {
            console.warn('Failed to load logo.png, using fallback');
            // Fallback to gradient background if logo fails to load
            drawLogoFallback(ctx, x, y, size);
            resolve();
        };
        
        // Set timeout to prevent hanging
        setTimeout(() => {
            if (!img.complete) {
                console.warn('Logo load timeout, using fallback');
                drawLogoFallback(ctx, x, y, size);
                resolve();
            }
        }, 5000);
        
        console.log('Loading logo.png...');
        img.src = 'logo.png';
    });
}

function drawLogoFallback(ctx, x, y, size) {
    // Create gradient background for stable logo fallback
    const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, size, size);
    
    // Add text with Efour DigiPro font
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px CustomFont, Efour DigiPro, CustomFont, Efour DigiPro, Arial, sans-serif, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('STABLE', x + size/2, y + size/2 - 10);
    ctx.fillText('LOGO', x + size/2, y + size/2 + 10);
}

async function drawNFTImage(ctx, nft, x, y, size) {
    return new Promise((resolve, reject) => {
        try {
            const img = new Image();
            
            img.onload = function() {
                try {
                    // Ensure image is fully loaded and accessible
                    if (img.complete && img.naturalWidth > 0) {
                        // Draw image with proper scaling
                        ctx.drawImage(img, x, y, size, size);
                        console.log(`Successfully drew NFT image: ${nft.name}`);
                        resolve();
                    } else {
                        console.warn(`Image not fully loaded for NFT: ${nft.name}`);
                        drawPlaceholder(ctx, x, y, size, nft.name);
                        resolve();
                    }
                } catch (error) {
                    console.error('Error drawing image:', error);
                    drawPlaceholder(ctx, x, y, size, nft.name);
                    resolve();
                }
            };
            
            img.onerror = function() {
                console.warn(`Failed to load image for NFT: ${nft.name}, URL: ${nft.image}`);
                drawPlaceholder(ctx, x, y, size, nft.name);
                resolve();
            };
            
            // Set timeout to prevent hanging
            setTimeout(() => {
                if (!img.complete) {
                    console.warn(`Image load timeout for NFT: ${nft.name}`);
                    drawPlaceholder(ctx, x, y, size, nft.name);
                    resolve();
                }
            }, 8000); // Increased timeout for proxy
            
            console.log(`Loading image for NFT: ${nft.name}, URL: ${nft.image}`);
            
            // Use proxy to avoid CORS issues
            if (nft.image) {
                // Check if it's already a data URL or local
                if (nft.image.startsWith('data:') || nft.image.startsWith('/') || nft.image.startsWith(window.location.origin)) {
                    img.src = nft.image;
                } else {
                    // Use proxy for external images
                    const proxyUrl = `/proxy/${encodeURIComponent(nft.image)}`;
                    console.log(`Using proxy URL: ${proxyUrl}`);
                    img.src = proxyUrl;
                }
            } else {
                console.warn(`No image URL for NFT: ${nft.name}`);
                drawPlaceholder(ctx, x, y, size, nft.name);
                resolve();
            }
            
        } catch (error) {
            console.error('Error in drawNFTImage:', error);
            drawPlaceholder(ctx, x, y, size, nft.name);
            resolve();
        }
    });
}

async function drawNFTImageHD(ctx, nft, x, y, size) {
    return new Promise((resolve, reject) => {
        try {
            const img = new Image();
            
            img.onload = function() {
                try {
                    // Ensure image is fully loaded and accessible
                    if (img.complete && img.naturalWidth > 0) {
                        // Draw image with high-quality scaling
                        ctx.drawImage(img, x, y, size, size);
                        console.log(`Successfully drew HD NFT image: ${nft.name}`);
                        resolve();
                    } else {
                        console.warn(`HD Image not fully loaded for NFT: ${nft.name}`);
                        drawPlaceholderHD(ctx, x, y, size, nft.name);
                        resolve();
                    }
                } catch (error) {
                    console.error('Error drawing HD image:', error);
                    drawPlaceholderHD(ctx, x, y, size, nft.name);
                    resolve();
                }
            };
            
            img.onerror = function() {
                console.warn(`Failed to load HD image for NFT: ${nft.name}, URL: ${nft.image}`);
                drawPlaceholderHD(ctx, x, y, size, nft.name);
                resolve();
            };
            
            // Set timeout to prevent hanging
            setTimeout(() => {
                if (!img.complete) {
                    console.warn(`HD Image load timeout for NFT: ${nft.name}`);
                    drawPlaceholderHD(ctx, x, y, size, nft.name);
                    resolve();
                }
            }, 10000); // Longer timeout for HD images
            
            console.log(`Loading HD image for NFT: ${nft.name}, URL: ${nft.image}`);
            
            // Use proxy to avoid CORS issues
            if (nft.image) {
                if (nft.image.startsWith('data:') || nft.image.startsWith('/') || nft.image.startsWith(window.location.origin)) {
                    img.src = nft.image;
                } else {
                    const proxyUrl = `/proxy/${encodeURIComponent(nft.image)}`;
                    console.log(`Using proxy URL for HD: ${proxyUrl}`);
                    img.src = proxyUrl;
                }
            } else {
                console.warn(`No image URL for HD NFT: ${nft.name}`);
                drawPlaceholderHD(ctx, x, y, size, nft.name);
                resolve();
            }
            
        } catch (error) {
            console.error('Error in drawNFTImageHD:', error);
            drawPlaceholderHD(ctx, x, y, size, nft.name);
            resolve();
        }
    });
}

function drawPlaceholder(ctx, x, y, size, nftName) {
    // Draw placeholder background with dark theme
    ctx.fillStyle = '#252536'; // Dark surface background
    ctx.fillRect(x, y, size, size);
    
    // Draw border with white border for consistency (much thicker for visibility)
    ctx.strokeStyle = 'white'; // White border for placeholder
    ctx.lineWidth = 6; // Much thicker for video visibility
    ctx.strokeRect(x, y, size, size);
    
    // Draw text with dark theme muted text color
    ctx.fillStyle = '#718096'; // Dark muted text color
    ctx.font = 'bold 14px CustomFont, Efour DigiPro, CustomFont, Efour DigiPro, Arial, sans-serif, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Split long names
    const words = nftName.split(' ');
    const maxLength = 8;
    let displayText = nftName;
    
    if (nftName.length > maxLength) {
        displayText = nftName.substring(0, maxLength) + '...';
    }
    
    ctx.fillText(displayText, x + size/2, y + size/2);
}

function drawPlaceholderHD(ctx, x, y, size, nftName) {
    // Draw HD placeholder background with dark theme
    ctx.fillStyle = '#252536'; // Dark surface background
    ctx.fillRect(x, y, size, size);
    
    // Draw border with white border for consistency (thicker for HD)
    ctx.strokeStyle = 'white'; // White border for placeholder
    ctx.lineWidth = 24; // Much thicker for HD visibility
    ctx.strokeRect(x, y, size, size);
    
    // Draw text with dark theme muted text color (larger for HD)
    ctx.fillStyle = '#718096'; // Dark muted text color
    ctx.font = 'bold 56px CustomFont, Efour DigiPro, CustomFont, Efour DigiPro, Arial, sans-serif, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Split long names
    const words = nftName.split(' ');
    const maxLength = 8;
    let displayText = nftName;
    
    if (nftName.length > maxLength) {
        displayText = nftName.substring(0, maxLength) + '...';
    }
    
    ctx.fillText(displayText, x + size/2, y + size/2);
}

function updateCollagePreview(canvas) {
    // Create a preview element
    const preview = document.createElement('div');
    preview.style.textAlign = 'center';
    preview.style.marginTop = '20px';
    
    const img = document.createElement('img');
    img.src = canvas.toDataURL();
    img.style.maxWidth = '300px';
    img.style.border = '2px solid white'; // White border for preview
    img.style.borderRadius = '10px';
    
    preview.appendChild(img);
    
    // Remove existing preview
    const existingPreview = document.querySelector('.collage-preview-generated');
    if (existingPreview) {
        existingPreview.remove();
    }
    
    preview.className = 'collage-preview-generated';
    collageGrid.parentNode.appendChild(preview);
}

async function downloadCollage(format) {
    if (!window.generatedCanvas) {
        showError('Please generate a collage first');
        return;
    }
    
    try {
        const canvas = window.generatedCanvas;
        
        if (format === 'gif') {
            await downloadAsGIF(canvas);
        } else {
            downloadAsPNG(canvas);
        }
        
    } catch (error) {
        console.error(`Error downloading ${format}:`, error);
        showError(`Failed to download ${format.toUpperCase()}. Please try again.`);
    }
}

async function downloadAsGIF(canvas) {
    try {
        // Check if we have animated NFTs
        const hasAnimatedNFTs = collageOrder.some(index => userNFTs[index].isAnimated);
        
        console.log('Checking for animated NFTs:', {
            collageOrder,
            hasAnimatedNFTs,
            nftData: collageOrder.map(index => ({
                index,
                name: userNFTs[index]?.name,
                isAnimated: userNFTs[index]?.isAnimated,
                animationUrl: userNFTs[index]?.animationUrl
            }))
        });
        
        if (hasAnimatedNFTs) {
            showError('GIF encoding is slow. Please use "Download MP4" for animated NFTs instead!');
            setTimeout(() => {
                showError('Redirecting to video download...');
                downloadAsMP4(canvas);
            }, 2000);
            return;
        }
        
        showError('Creating static collage GIF...');
        
        // For static NFTs, create a single frame GIF with optimized settings
        const gif = new GIF({
            workers: 0, // Disable workers to avoid CORS issues
            quality: 30, // Higher quality number = faster encoding
            width: canvas.width,
            height: canvas.height
        });
        
        // Add single frame
        gif.addFrame(canvas, { delay: 1000 });
        
        // Render the GIF
        gif.on('finished', function(blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `nodes-collage-${Date.now()}.gif`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
            
            hideError();
            showError('Static collage GIF downloaded successfully!');
        });
        
        gif.on('error', function(error) {
            console.error('GIF creation error:', error);
            showError('Failed to create GIF. Downloading as PNG instead.');
            downloadAsPNG(canvas);
        });
        
        gif.render();
        
    } catch (error) {
        console.error('GIF creation error:', error);
        showError('Failed to create GIF. Downloading as PNG instead.');
        downloadAsPNG(canvas);
    }
}

async function downloadAsMP4(canvas) {
    try {
        // Check if we have animated NFTs
        const hasAnimatedNFTs = collageOrder.some(index => userNFTs[index].isAnimated);
        
        console.log('MP4 - Checking for animated NFTs:', {
            collageOrder,
            hasAnimatedNFTs,
            nftData: collageOrder.map(index => ({
                index,
                name: userNFTs[index]?.name,
                isAnimated: userNFTs[index]?.isAnimated,
                animationUrl: userNFTs[index]?.animationUrl
            }))
        });
        
        if (hasAnimatedNFTs) {
            showError('Detected animated NFTs! Extracting real animation frames for video...');
            await generateRealAnimatedVideo();
            return;
        }
        
        showError('No animated NFTs detected. Downloading as PNG instead.');
        downloadAsPNG(canvas);
        
    } catch (error) {
        console.error('MP4 creation error:', error);
        showError('Failed to create video. Downloading as PNG instead.');
        downloadAsPNG(canvas);
    }
}


async function downloadAsPNG(canvas) {
    try {
        showError('Generating high-quality PNG...');
        
        // Create high-resolution canvas for PNG (4x resolution for crisp quality)
        const hdCanvas = document.createElement('canvas');
        const hdCtx = hdCanvas.getContext('2d', {
            alpha: false,
            desynchronized: false,
            colorSpace: 'srgb',
            willReadFrequently: false
        });
        
        // High resolution: 2400x2400 (800x800 per cell for crisp quality)
        const hdCellSize = 800;
        hdCanvas.width = hdCellSize * 3;
        hdCanvas.height = hdCellSize * 3;
        
        // Enable high-quality image smoothing
        hdCtx.imageSmoothingEnabled = true;
        hdCtx.imageSmoothingQuality = 'high';
        
        console.log(`Creating HD PNG: ${hdCanvas.width}x${hdCanvas.height}`);
        
        // Preload logo for HD version
        const logoImg = new Image();
        logoImg.src = 'logo.png';
        await new Promise((resolve) => {
            logoImg.onload = resolve;
            logoImg.onerror = resolve;
        });
        
        // Fill background
        hdCtx.fillStyle = '#1e1e2f';
        hdCtx.fillRect(0, 0, hdCanvas.width, hdCanvas.height);
        
        // Draw logo in top-left
        if (logoImg.complete) {
            hdCtx.drawImage(logoImg, 0, 0, hdCellSize, hdCellSize);
        } else {
            // Fallback gradient
            const gradient = hdCtx.createLinearGradient(0, 0, hdCellSize, hdCellSize);
            gradient.addColorStop(0, '#667eea');
            gradient.addColorStop(1, '#764ba2');
            hdCtx.fillStyle = gradient;
            hdCtx.fillRect(0, 0, hdCellSize, hdCellSize);
            hdCtx.fillStyle = 'white';
            hdCtx.font = 'bold 64px CustomFont, Efour DigiPro, Arial, sans-serif';
            hdCtx.textAlign = 'center';
            hdCtx.textBaseline = 'middle';
            hdCtx.fillText('STABLE', hdCellSize/2, hdCellSize/2 - 40);
            hdCtx.fillText('LOGO', hdCellSize/2, hdCellSize/2 + 40);
        }
        
        // Draw NFTs at high resolution
        for (let i = 1; i < 9; i++) {
            const nftIndex = i - 1;
            const row = Math.floor(i / 3);
            const col = i % 3;
            const x = col * hdCellSize;
            const y = row * hdCellSize;
            
            if (nftIndex < collageOrder.length) {
                const nft = userNFTs[collageOrder[nftIndex]];
                await drawNFTImageHD(hdCtx, nft, x, y, hdCellSize);
            } else {
                // Fill empty slots with logo
                if (logoImg.complete) {
                    hdCtx.drawImage(logoImg, x, y, hdCellSize, hdCellSize);
                } else {
                    const gradient = hdCtx.createLinearGradient(x, y, x + hdCellSize, y + hdCellSize);
                    gradient.addColorStop(0, '#667eea');
                    gradient.addColorStop(1, '#764ba2');
                    hdCtx.fillStyle = gradient;
                    hdCtx.fillRect(x, y, hdCellSize, hdCellSize);
                    hdCtx.fillStyle = 'white';
                    hdCtx.font = 'bold 64px CustomFont, Efour DigiPro, Arial, sans-serif';
                    hdCtx.textAlign = 'center';
                    hdCtx.textBaseline = 'middle';
                    hdCtx.fillText('STABLE', x + hdCellSize/2, y + hdCellSize/2 - 40);
                    hdCtx.fillText('LOGO', x + hdCellSize/2, y + hdCellSize/2 + 40);
                }
            }
        }
        
        // Draw high-resolution grid lines
        hdCtx.strokeStyle = 'white';
        hdCtx.lineWidth = 32; // Thick lines for HD
        
        for (let i = 1; i < 3; i++) {
            hdCtx.beginPath();
            hdCtx.moveTo(i * hdCellSize, 0);
            hdCtx.lineTo(i * hdCellSize, hdCanvas.height);
            hdCtx.stroke();
            
            hdCtx.beginPath();
            hdCtx.moveTo(0, i * hdCellSize);
            hdCtx.lineTo(hdCanvas.width, i * hdCellSize);
            hdCtx.stroke();
        }
        
        // Draw high-resolution border
        hdCtx.strokeStyle = 'white';
        hdCtx.lineWidth = 40; // Extra thick outer border
        hdCtx.strokeRect(0, 0, hdCanvas.width, hdCanvas.height);
        
        // Download the high-resolution PNG
        const link = document.createElement('a');
        link.download = `nodes-collage-hd-${Date.now()}.png`;
        link.href = hdCanvas.toDataURL('image/png', 1.0); // Maximum quality
        link.click();
        
        hideError();
        showError('High-quality PNG downloaded successfully!');
        
    } catch (error) {
        console.error('Error generating HD PNG:', error);
        // Fallback to original canvas
        const link = document.createElement('a');
        link.download = `nodes-collage-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        hideError();
        showError('PNG downloaded successfully!');
    }
}

// UI Helper functions
function showLoading(show) {
    loadingDiv.classList.toggle('hidden', !show);
}

function showNFTSelection() {
    nftSelectionDiv.classList.remove('hidden');
}

function showCollageSection() {
    collageSection.classList.remove('hidden');
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
}

function hideError() {
    errorMessage.classList.add('hidden');
}




async function drawImageFromData(ctx, imageData, x, y, size) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = function() {
            ctx.drawImage(img, x, y, size, size);
            resolve();
        };
        img.onerror = function() {
            resolve();
        };
        img.src = imageData;
    });
}

// Extract frames from GIF using omggif library
async function extractGifFrames(gifUrl) {
    try {
        console.log('Extracting GIF frames from:', gifUrl);
        
        // Fetch the GIF file - use CORS proxy for external URLs
        let fetchUrl = gifUrl;
        if (!gifUrl.startsWith('data:') && !gifUrl.startsWith('/') && !gifUrl.startsWith(window.location.origin)) {
            // Use CORS proxy for external URLs
            fetchUrl = `https://corsproxy.io/?${encodeURIComponent(gifUrl)}`;
            console.log('Using CORS proxy:', fetchUrl);
        }
        
        const response = await fetch(fetchUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch GIF: ${response.status}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Parse GIF using omggif
        const reader = new GifReader(uint8Array);
        const frameCount = reader.numFrames();
        
        console.log(`Found ${frameCount} frames in GIF`);
        
        if (frameCount === 0) {
            return null;
        }
        
        const width = reader.width;
        const height = reader.height;
        const frames = [];
        
        // Create a persistent canvas to build up frames (for proper GIF compositing)
        const compositeCanvas = document.createElement('canvas');
        compositeCanvas.width = width;
        compositeCanvas.height = height;
        const compositeCtx = compositeCanvas.getContext('2d');
        
        // Extract each frame with proper compositing
        for (let i = 0; i < frameCount; i++) {
            const frameInfo = reader.frameInfo(i);
            
            // Decode the frame pixels
            const pixels = new Uint8Array(width * height * 4);
            reader.decodeAndBlitFrameRGBA(i, pixels);
            
            // Create temporary canvas for this frame's pixels
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = width;
            tempCanvas.height = height;
            const tempCtx = tempCanvas.getContext('2d');
            
            const imageData = tempCtx.createImageData(width, height);
            imageData.data.set(pixels);
            tempCtx.putImageData(imageData, 0, 0);
            
            // Composite onto the persistent canvas (this handles delta frames properly)
            // Check disposal method
            if (i > 0 && frameInfo.disposal === 2) {
                // Disposal method 2: restore to background
                compositeCtx.clearRect(0, 0, width, height);
            }
            // Don't clear for disposal method 0 or 1 (keep previous frame)
            
            // Draw the new frame on top
            compositeCtx.drawImage(tempCanvas, 0, 0);
            
            // Save the complete composited frame with maximum quality
            frames.push({
                dataUrl: compositeCanvas.toDataURL('image/png'), // PNG for lossless quality
                delay: (frameInfo.delay || 10) * 10 // delay is in hundredths of a second
            });
        }
        
        console.log(`Successfully extracted ${frames.length} frames`);
        return frames;
        
    } catch (error) {
        console.error('Error extracting GIF frames:', error);
        return null;
    }
}

async function generateRealAnimatedCollage() {
    try {
        console.log('=== Starting generateRealAnimatedCollage ===');
        showError('Creating collage with real NFT animations... This may take a moment.');
        
        // Get animated NFTs
        const animatedNFTIndices = collageOrder.filter(index => userNFTs[index].isAnimated);
        
        console.log(`Found ${animatedNFTIndices.length} animated NFTs out of ${collageOrder.length} selected`);
        console.log('Animated NFT indices:', animatedNFTIndices);
        console.log('Animated NFT data:', animatedNFTIndices.map(i => userNFTs[i]));
        
        if (animatedNFTIndices.length === 0) {
            showError('No animated NFTs found. Creating static collage instead.');
            await generateCollage();
            return;
        }
        
        // Extract frames from all animated NFTs
        const nftFramesMap = new Map();
        let maxFrameCount = 0;
        
        for (const nftIndex of animatedNFTIndices) {
            const nft = userNFTs[nftIndex];
            console.log(`Extracting frames from: ${nft.name}`);
            
            const frames = await extractGifFrames(nft.animationUrl || nft.image);
            
            if (frames && frames.length > 0) {
                nftFramesMap.set(nftIndex, frames);
                maxFrameCount = Math.max(maxFrameCount, frames.length);
                console.log(`  Extracted ${frames.length} frames`);
            } else {
                console.warn(`  Failed to extract frames, will use static image`);
            }
        }
        
        if (nftFramesMap.size === 0) {
            showError('Failed to extract animation frames. Creating static collage instead.');
            await generateCollage();
            return;
        }
        
        // Limit frames to prevent performance issues
        const limitedFrameCount = Math.min(maxFrameCount, 30); // Max 30 frames
        console.log(`Total frames available: ${maxFrameCount}, using: ${limitedFrameCount}`);
        console.log('Starting GIF creation...');
        
        // Preload logo image to prevent async loading issues
        const logoImg = new Image();
        logoImg.src = 'logo.png';
        await new Promise((resolve) => {
            logoImg.onload = resolve;
            logoImg.onerror = resolve; // Continue even if logo fails
        });
        
        // Create GIF with optimized settings for faster encoding
        const gif = new GIF({
            workers: 0, // Disable workers to avoid CORS issues
            quality: 30, // Higher quality number = faster encoding (1-30, higher is faster)
            width: 600,
            height: 600,
            dither: false, // Disable dithering for speed
            transparent: null
        });
        
        const cellSize = 200;
        
        // Create frames for the collage
        console.log(`Creating ${limitedFrameCount} collage frames...`);
        for (let frameIndex = 0; frameIndex < limitedFrameCount; frameIndex++) {
            if (frameIndex % 5 === 0) {
                console.log(`Processing frame ${frameIndex + 1}/${maxFrameCount}...`);
            }
            const frameCanvas = document.createElement('canvas');
            const frameCtx = frameCanvas.getContext('2d');
            frameCanvas.width = 600;
            frameCanvas.height = 600;
            
            // Fill background with dark theme
            frameCtx.fillStyle = '#1e1e2f'; // Dark card background
            frameCtx.fillRect(0, 0, 600, 600);
            
            // Draw stable logo in top-left (synchronous to prevent timing issues)
            if (logoImg.complete) {
                frameCtx.drawImage(logoImg, 0, 0, cellSize, cellSize);
            } else {
                // Fallback gradient if logo not loaded
                const gradient = frameCtx.createLinearGradient(0, 0, cellSize, cellSize);
                gradient.addColorStop(0, '#667eea');
                gradient.addColorStop(1, '#764ba2');
                frameCtx.fillStyle = gradient;
                frameCtx.fillRect(0, 0, cellSize, cellSize);
                frameCtx.fillStyle = 'white';
                frameCtx.font = 'bold 16px CustomFont, Efour DigiPro, Arial, sans-serif';
                frameCtx.textAlign = 'center';
                frameCtx.textBaseline = 'middle';
                frameCtx.fillText('STABLE', cellSize/2, cellSize/2 - 10);
                frameCtx.fillText('LOGO', cellSize/2, cellSize/2 + 10);
            }
            
            // Draw NFTs (single pass - removed redundant drawing)
            for (let i = 1; i < 9; i++) {
                const nftIndex = i - 1;
                const row = Math.floor(i / 3);
                const col = i % 3;
                const x = col * cellSize;
                const y = row * cellSize;
                
                if (nftIndex < collageOrder.length) {
                    const nft = userNFTs[collageOrder[nftIndex]];
                    const nftFrames = nftFramesMap.get(collageOrder[nftIndex]);
                    
                    if (nftFrames && nftFrames.length > 0) {
                        // Use the current animation frame (loop if necessary)
                        const currentFrame = nftFrames[frameIndex % nftFrames.length];
                        await drawImageFromData(frameCtx, currentFrame.dataUrl, x, y, cellSize);
                    } else {
                        // Use static image
                        await drawNFTImage(frameCtx, nft, x, y, cellSize);
                    }
                } else {
                    // Fill with stable logo (synchronous)
                    if (logoImg.complete) {
                        frameCtx.drawImage(logoImg, x, y, cellSize, cellSize);
                    } else {
                        // Fallback gradient if logo not loaded
                        const gradient = frameCtx.createLinearGradient(x, y, x + cellSize, y + cellSize);
                        gradient.addColorStop(0, '#667eea');
                        gradient.addColorStop(1, '#764ba2');
                        frameCtx.fillStyle = gradient;
                        frameCtx.fillRect(x, y, cellSize, cellSize);
                        frameCtx.fillStyle = 'white';
                        frameCtx.font = 'bold 16px CustomFont, Efour DigiPro, Arial, sans-serif';
                        frameCtx.textAlign = 'center';
                        frameCtx.textBaseline = 'middle';
                        frameCtx.fillText('STABLE', x + cellSize/2, y + cellSize/2 - 10);
                        frameCtx.fillText('LOGO', x + cellSize/2, y + cellSize/2 + 10);
                    }
                }
            }
            
            // Draw white grid lines on TOP for maximum visibility
            frameCtx.strokeStyle = 'white';
            frameCtx.lineWidth = 8; // Very thick lines
            
            for (let i = 1; i < 3; i++) {
                frameCtx.beginPath();
                frameCtx.moveTo(i * cellSize, 0);
                frameCtx.lineTo(i * cellSize, 600);
                frameCtx.stroke();
                
                frameCtx.beginPath();
                frameCtx.moveTo(0, i * cellSize);
                frameCtx.lineTo(600, i * cellSize);
                frameCtx.stroke();
            }
            
            // Use the delay from the first animated NFT
            const firstNFTFrames = nftFramesMap.values().next().value;
            const delay = firstNFTFrames[frameIndex % firstNFTFrames.length]?.delay || 100;
            
            // Draw white border around entire frame
            frameCtx.strokeStyle = 'white';
            frameCtx.lineWidth = 10; // Extra thick outer border
            frameCtx.strokeRect(0, 0, 600, 600);
            
            gif.addFrame(frameCanvas, { delay });
        }
        
        console.log('All frames added to GIF. Starting render...');
        
        // Add timeout to detect if rendering is stuck
        let renderTimeout = setTimeout(() => {
            console.error('GIF rendering timeout - taking too long!');
            showError('GIF rendering is taking too long. The file might be too large. Try with fewer NFTs or lower quality.');
        }, 60000); // 60 second timeout
        
        // Render the GIF
        gif.on('finished', function(blob) {
            clearTimeout(renderTimeout);
            console.log('GIF rendering finished! Blob size:', blob.size);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `nodes-animated-collage-${Date.now()}.gif`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
            
            hideError();
            showError('Animated collage with real NFT animations downloaded successfully!');
        });
        
        gif.on('progress', function(p) {
            console.log('GIF rendering progress:', Math.round(p * 100) + '%');
            showError(`Rendering GIF: ${Math.round(p * 100)}%`);
        });
        
        gif.on('start', function() {
            console.log('GIF rendering started!');
        });
        
        gif.on('abort', function() {
            clearTimeout(renderTimeout);
            console.error('GIF rendering aborted!');
            showError('GIF rendering was aborted.');
        });
        
        gif.on('error', function(error) {
            clearTimeout(renderTimeout);
            console.error('GIF creation error:', error);
            showError('Failed to create animated collage. Creating static collage instead.');
            generateCollage();
        });
        
        console.log('Calling gif.render()...');
        try {
            gif.render();
            console.log('gif.render() called successfully');
        } catch (error) {
            clearTimeout(renderTimeout);
            console.error('Error calling gif.render():', error);
            showError('Failed to start GIF rendering: ' + error.message);
        }
        
    } catch (error) {
        console.error('Error generating real animated collage:', error);
        showError('Failed to create animated collage. Creating static collage instead.');
        generateCollage();
    }
}

async function generateRealAnimatedVideo() {
    try {
        showError('Creating 2-second video with animations...');
        
        console.log('Starting video generation with GIFs as-is');
        
        // Check if MediaRecorder is supported
        if (!window.MediaRecorder) {
            showError('Video recording not supported in this browser.');
            downloadAsPNG(window.generatedCanvas);
            return;
        }
        
        // Create canvas for video recording with optimized resolution
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', {
            alpha: false, // No transparency for better compression
            desynchronized: false,
            colorSpace: 'srgb', // Preserve colors
            willReadFrequently: false
        });
        // Use 600x600 for optimal quality and performance (200x200 per cell)
        canvas.width = 600;
        canvas.height = 600;
        
        // Enable high-quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Extract frames for animated GIFs, load static images for PNGs
        const nftFramesMap = new Map();
        const targetFrameCount = 16; // 16 frames for fast playback
        
        showError('Loading and extracting frames...');
        
        // Detect original NFT resolution from the first NFT
        let originalNFTSize = 400; // Default fallback
        const firstNFT = userNFTs[collageOrder[0]];
        if (firstNFT) {
            const testImg = new Image();
            testImg.crossOrigin = 'anonymous';
            let testUrl = firstNFT.animationUrl || firstNFT.image;
            if (testUrl && !testUrl.startsWith('data:') && !testUrl.startsWith('/') && !testUrl.startsWith(window.location.origin)) {
                testUrl = `https://corsproxy.io/?${encodeURIComponent(testUrl)}`;
            }
            testImg.src = testUrl;
            await new Promise((resolve) => {
                testImg.onload = () => {
                    originalNFTSize = testImg.width; // Use original width
                    console.log(`Detected original NFT size: ${originalNFTSize}x${originalNFTSize}`);
                    resolve();
                };
                testImg.onerror = () => {
                    console.warn('Could not detect NFT size, using default 400');
                    resolve();
                };
            });
        }
        
        // Use optimized cell size for better performance
        const cellSize = 200; // Fixed 200x200 per cell for optimal performance
        canvas.width = cellSize * 3;
        canvas.height = cellSize * 3;
        console.log(`Canvas size: ${canvas.width}x${canvas.height} (${cellSize}x${cellSize} per cell)`);
        
        for (let i = 0; i < collageOrder.length; i++) {
            const nft = userNFTs[collageOrder[i]];
            
            if (nft.isAnimated) {
                // Extract GIF frames
                console.log(`Extracting frames from animated: ${nft.name}`);
                const frames = await extractGifFrames(nft.animationUrl || nft.image);
                
                if (frames && frames.length > 0) {
                    console.log(`  Extracted ${frames.length} frames, normalizing to ${targetFrameCount}`);
                    
                    // Normalize to targetFrameCount by resampling - PRELOAD ALL
                    const normalizedFrames = [];
                    
                    // First, create all Image objects and load them
                    const loadPromises = [];
                    for (let f = 0; f < targetFrameCount; f++) {
                        // Map current frame to source frame (with looping)
                        const sourceIndex = Math.floor((f / targetFrameCount) * frames.length) % frames.length;
                        const frame = frames[sourceIndex];
                        
                        const img = new Image();
                        img.src = frame.dataUrl;
                        
                        const loadPromise = new Promise((resolve) => {
                            img.onload = () => resolve(img);
                            img.onerror = () => resolve(img);
                        });
                        
                        loadPromises.push(loadPromise);
                    }
                    
                    // Wait for ALL frames to load
                    const loadedImages = await Promise.all(loadPromises);
                    normalizedFrames.push(...loadedImages);
                    
                    nftFramesMap.set(collageOrder[i], normalizedFrames);
                    console.log(`  ✓ Preloaded ${normalizedFrames.length} frames`);
                } else {
                    console.warn(`  Failed to extract frames for ${nft.name}`);
                }
            } else {
                // Static image - just load once and repeat for all frames
                console.log(`Loading static image: ${nft.name}`);
                const img = new Image();
                img.crossOrigin = 'anonymous';
                
                let imageUrl = nft.image;
                if (imageUrl && !imageUrl.startsWith('data:') && !imageUrl.startsWith('/') && !imageUrl.startsWith(window.location.origin)) {
                    imageUrl = `https://corsproxy.io/?${encodeURIComponent(imageUrl)}`;
                }
                
                img.src = imageUrl;
                await new Promise((resolve) => {
                    img.onload = resolve;
                    img.onerror = () => {
                        console.warn(`Failed to load image for ${nft.name}`);
                        resolve();
                    };
                });
                
                // Create array with same image repeated for all frames
                const staticFrames = new Array(targetFrameCount).fill(img);
                nftFramesMap.set(collageOrder[i], staticFrames);
                console.log(`  Loaded static image (${targetFrameCount} frames)`);
            }
        }
        
        console.log('All frames loaded and normalized! Verifying...');
        
        // Verify all NFTs have exactly 16 frames
        for (const [nftIndex, frames] of nftFramesMap.entries()) {
            console.log(`NFT ${nftIndex}: ${frames.length} frames, all loaded: ${frames.every(f => f.complete)}`);
        }
        
        showError('Starting video recording...');
        
        // Preload logo image to prevent async loading issues
        const logoImg = new Image();
        logoImg.src = 'logo.png';
        await new Promise((resolve) => {
            logoImg.onload = resolve;
            logoImg.onerror = resolve; // Continue even if logo fails
        });
        
        // Set up MediaRecorder - 30 FPS for smooth playback and smaller file size
        const stream = canvas.captureStream(30); // 30 FPS - optimized for smooth playback
        
        let mimeType = 'video/webm;codecs=vp9';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'video/webm;codecs=vp8';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = 'video/webm';
            }
        }
        
        const mediaRecorder = new MediaRecorder(stream, { 
            mimeType, 
            videoBitsPerSecond: 10000000 // 10 Mbps for high quality
        });
        const chunks = [];
        
        mediaRecorder.ondataavailable = function(event) {
            if (event.data.size > 0) {
                chunks.push(event.data);
            }
        };
        
        mediaRecorder.onstop = function() {
            const blob = new Blob(chunks, { type: mimeType });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `nodes-animated-collage-${Date.now()}.webm`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
            
            stream.getTracks().forEach(track => track.stop());
            
            hideError();
            showError('Animated video downloaded successfully!');
        };
        
        // Don't start recording yet - will start after warmup
        showError('Warming up recording...');
        
        // Optimized timing for smooth playback
        const fps = 30; // 30 FPS for smooth playback and smaller file size
        const duration = 2; // 2 seconds total
        const baseFrames = 16; // 16 unique frames
        const warmupFrames = 16; // Reduced warmup for faster start
        const totalFrames = fps * duration; // 60 frames (16 frames looped 3.75 times at 30fps)
        let frameIndex = -warmupFrames; // Start negative to warm up
        let isRecording = false;
        
        // Pre-calculate positions to avoid calculations in draw loop
        const cellPositions = [];
        for (let i = 0; i < 9; i++) {
            cellPositions.push({
                row: Math.floor(i / 3),
                col: i % 3,
                x: (i % 3) * cellSize,
                y: Math.floor(i / 3) * cellSize
            });
        }
        
        const drawFrame = async () => {
            // Start recording after warmup
            if (frameIndex === 0 && !isRecording) {
                console.log('Warmup complete, starting recording...');
                mediaRecorder.start();
                isRecording = true;
                showError('Recording 2-second looping video at 30 FPS...');
            }
            
            if (frameIndex >= totalFrames) {
                console.log('Recording complete, stopping...');
                setTimeout(() => mediaRecorder.stop(), 200);
                return;
            }
            
            if (frameIndex % 30 === 0 && frameIndex >= 0) {
                console.log(`Recording frame ${frameIndex + 1}/${totalFrames}`);
            }
            
            // IMPORTANT: Clear and redraw EVERYTHING each frame for video recording
            
            // Fill background with dark theme
            ctx.fillStyle = '#1e1e2f'; // Dark card background
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw stable logo in top-left (synchronous to prevent timing issues)
            if (logoImg.complete) {
                ctx.drawImage(logoImg, 0, 0, cellSize, cellSize);
            } else {
                // Fallback gradient if logo not loaded
                const gradient = ctx.createLinearGradient(0, 0, cellSize, cellSize);
                gradient.addColorStop(0, '#667eea');
                gradient.addColorStop(1, '#764ba2');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, cellSize, cellSize);
                ctx.fillStyle = 'white';
                ctx.font = 'bold 16px CustomFont, Efour DigiPro, Arial, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('STABLE', cellSize/2, cellSize/2 - 10);
                ctx.fillText('LOGO', cellSize/2, cellSize/2 + 10);
            }
            
            // Draw NFTs
            for (let i = 1; i < 9; i++) {
                const nftIndex = i - 1;
                const row = Math.floor(i / 3);
                const col = i % 3;
                const x = col * cellSize;
                const y = row * cellSize;
                
                if (nftIndex < collageOrder.length) {
                    const nftGlobalIndex = collageOrder[nftIndex];
                    const frames = nftFramesMap.get(nftGlobalIndex);
                    
                    if (frames && frames.length > 0) {
                        // Loop through the frames (handle negative warmup frames)
                        const currentFrameIndex = Math.abs(frameIndex) % baseFrames;
                        const img = frames[currentFrameIndex];
                        if (img && img.complete && img.naturalWidth > 0) {
                            ctx.drawImage(img, x, y, cellSize, cellSize);
                        } else {
                            // Fallback placeholder - only show if image truly failed
                            ctx.fillStyle = '#e2e8f0';
                            ctx.fillRect(x, y, cellSize, cellSize);
                            ctx.strokeStyle = '#999';
                            ctx.lineWidth = 2;
                            ctx.strokeRect(x, y, cellSize, cellSize);
                        }
                    } else {
                        // Placeholder
                        ctx.fillStyle = '#e2e8f0';
                        ctx.fillRect(x, y, cellSize, cellSize);
                    }
                } else {
                    // Fill empty slots with stable logo (synchronous)
                    if (logoImg.complete) {
                        ctx.drawImage(logoImg, x, y, cellSize, cellSize);
                    } else {
                        // Fallback gradient if logo not loaded
                        const gradient = ctx.createLinearGradient(x, y, x + cellSize, y + cellSize);
                        gradient.addColorStop(0, '#667eea');
                        gradient.addColorStop(1, '#764ba2');
                        ctx.fillStyle = gradient;
                        ctx.fillRect(x, y, cellSize, cellSize);
                        ctx.fillStyle = 'white';
                        ctx.font = 'bold 16px CustomFont, Efour DigiPro, Arial, sans-serif';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText('STABLE', x + cellSize/2, y + cellSize/2 - 10);
                        ctx.fillText('LOGO', x + cellSize/2, y + cellSize/2 + 10);
                    }
                }
            }
            
            frameIndex++;
            
            // Update progress
            if (frameIndex % 15 === 0) {
                showError(`Recording: ${Math.round((frameIndex / totalFrames) * 100)}%`);
            }
            
            // Draw white grid lines on TOP for maximum visibility (ULTRA THICK for video)
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 16; // Ultra thick lines for video visibility
            
            for (let i = 1; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(i * cellSize, 0);
                ctx.lineTo(i * cellSize, canvas.height);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(0, i * cellSize);
                ctx.lineTo(canvas.width, i * cellSize);
                ctx.stroke();
            }
            
            // Draw white border around entire video frame
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 18; // Ultra thick outer border for video
            ctx.strokeRect(0, 0, canvas.width, canvas.height);
            
            // Next frame - use requestAnimationFrame for smoother timing
            requestAnimationFrame(() => {
                setTimeout(() => drawFrame(), 1000 / fps);
            });
        };
        
        // Start drawing frames
        drawFrame();
        
    } catch (error) {
        console.error('Error generating real animated video:', error);
        showError('Failed to create animated video. Try downloading as GIF instead.');
        await generateRealAnimatedCollage();
    }
}
