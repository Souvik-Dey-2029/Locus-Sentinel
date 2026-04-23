const axios = require('axios');

const LOCUS_API_BASE = 'https://beta-api.paywithlocus.com/v1'; // Assuming /v1 based on previous prompt or fallback
const LOCUS_API_KEY = process.env.LOCUS_API_KEY || 'claw_dev_1234567890';

const axiosInstance = axios.create({
  baseURL: LOCUS_API_BASE,
  headers: {
    'Authorization': `Bearer ${LOCUS_API_KEY}`,
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Mock interceptor since beta-api.paywithlocus.com is likely a mock API for the hackathon
// If this is a real API, we can comment this out. But to ensure the app works without real credentials:
let mockDeployId = 0;
const mockDb = new Map();

axiosInstance.interceptors.request.use((config) => {
  if (process.env.USE_REAL_LOCUS_API !== 'true') {
    // Intercept and return mock responses to simulate Locus API
    config.adapter = async (config) => {
      const url = config.url;
      const method = config.method;

      if (method === 'post' && url === '/apps/deploy') {
        mockDeployId++;
        const id = `dep_${mockDeployId}`;
        const requestData = JSON.parse(config.data);
        mockDb.set(id, { id, status: 'building', url: null, repoUrl: requestData.repoUrl });
        
        // Simulate async build completion
        setTimeout(() => {
          const dep = mockDb.get(id);
          if (dep) {
            dep.status = 'LIVE';
            dep.url = `https://${id}.locus-preview.com`;
          }
        }, 12000); // Takes 12 seconds to become LIVE

        return {
          data: { success: true, deploymentId: id, status: 'building' },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        };
      }

      if (method === 'get' && url.startsWith('/apps/status/')) {
        const id = url.split('/').pop();
        const dep = mockDb.get(id);
        if (dep) {
          return {
            data: { success: true, deploymentId: id, status: dep.status, url: dep.url },
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
          };
        }
        return { data: { success: false, error: 'Not found' }, status: 404, statusText: 'Not Found', headers: {}, config };
      }

      if (method === 'post' && url.endsWith('/rollback')) {
        const parts = url.split('/');
        const id = parts[parts.length - 2];
        const dep = mockDb.get(id);
        if (dep) {
          dep.status = 'ROLLED_BACK';
          dep.url = null;
          return {
            data: { success: true, deploymentId: id, status: 'ROLLED_BACK' },
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
          };
        }
        return { data: { success: false, error: 'Not found' }, status: 404, statusText: 'Not Found', headers: {}, config };
      }
      
      // Fallback network error if not mocked
      return Promise.reject(new Error('Network Error - Route not mocked'));
    };
  }
  return config;
});

async function deployApp(repoUrl, env = {}) {
  try {
    // Sending POST request to /apps/deploy
    const response = await axiosInstance.post('/apps/deploy', {
      repoUrl,
      envVars: env,
    });
    return response.data;
  } catch (error) {
    console.error('[Locus Service] deployApp error:', error.message);
    throw new Error('Failed to initiate deployment.');
  }
}

async function getDeploymentStatus(id) {
  try {
    // Polling /apps/status/:id
    const response = await axiosInstance.get(`/apps/status/${id}`);
    return response.data;
  } catch (error) {
    console.error('[Locus Service] getDeploymentStatus error:', error.message);
    throw new Error('Failed to fetch deployment status.');
  }
}

async function triggerRollback(id) {
  try {
    // Calling /apps/:id/rollback
    const response = await axiosInstance.post(`/apps/${id}/rollback`);
    return response.data;
  } catch (error) {
    console.error('[Locus Service] triggerRollback error:', error.message);
    throw new Error('Failed to trigger rollback.');
  }
}

module.exports = {
  deployApp,
  getDeploymentStatus,
  triggerRollback
};
