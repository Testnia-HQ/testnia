import Pocketbase from 'pocketbase';

const POCKETBASE_API_URL = import.meta.env.VITE_PB_URL || '/hcgi/platform';

const pocketbaseClient = new Pocketbase(POCKETBASE_API_URL);

export default pocketbaseClient;

export { pocketbaseClient };
