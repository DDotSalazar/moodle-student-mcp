import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const MOODLE_URL = 'https://moodle.example.test';
export const MOODLE_TOKEN = 'fake-token';
export const WS_ENDPOINT = `${MOODLE_URL}/webservice/rest/server.php`;

export const mswServer = setupServer();

export { http, HttpResponse };
