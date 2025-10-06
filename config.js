// Configuration file for NODES NFT Collage Maker
const APP_CONFIG = {
    // Contract and API settings
    CONTRACT_ADDRESS: '0x95bc4c2e01c2e2d9e537e7a9fe58187e88dd8019',
    ALCHEMY_API_URL: 'https://base-mainnet.g.alchemy.com/nft/v3/51ovAh2TG206eo3DVmTYDEeYtL1gl91m/getNFTsForOwner',
    CHAIN: 'base-mainnet',
    COLLECTION_NAME: 'NODES',
    
    // UI settings
    MAX_SELECTION: 8,
    MIN_SELECTION: 2,
    GRID_SIZE: 3,
    CELL_SIZE: 200,
    
    // Export settings
    SUPPORTED_FORMATS: ['png', 'gif', 'mp4'],
    DEFAULT_FORMAT: 'png',
    
    // Error messages
    MESSAGES: {
        NO_WALLET: 'Please enter a wallet address',
        INVALID_WALLET: 'Please enter a valid Ethereum address',
        NO_NFTS: 'No NODES NFTs found in this wallet',
        FETCH_ERROR: 'Failed to fetch NFTs. Please check the wallet address and try again.',
        MIN_SELECTION_ERROR: 'Please select at least 2 NFTs',
        MAX_SELECTION_ERROR: 'You can select maximum 8 NFTs',
        GENERATE_ERROR: 'Failed to generate collage. Please try again.',
        GENERATE_SUCCESS: 'Collage generated successfully! You can now download it.',
        DOWNLOAD_ERROR: 'Please generate a collage first'
    }
};

// Make config available globally
window.APP_CONFIG = APP_CONFIG;
