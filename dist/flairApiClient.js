"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlairApiClient = void 0;
const axios_1 = __importDefault(require("axios"));
const flair_api_ts_1 = require("@ds-flair/flair-api-ts");
const TOKEN_EXPIRY_BUFFER_SECONDS = 20;
class FlairApiClient {
    options;
    http;
    token;
    pendingAuth;
    scopes;
    grantType;
    realm;
    tokenEndpoints;
    constructor(options) {
        this.options = options;
        this.scopes = this.options.scopes && this.options.scopes.length > 0 ? this.options.scopes : FlairApiClient.defaultScopes;
        this.http = axios_1.default.create({
            baseURL: this.options.baseURL ?? 'https://api.flair.co',
            headers: {
                Accept: 'application/vnd.api+json, application/json',
            },
        });
        this.grantType = this.options.grantType ?? 'password';
        this.realm = this.options.realm;
        const defaultEndpoints = ['/oauth2/token', '/oauth/token'];
        this.tokenEndpoints = this.options.tokenEndpoints && this.options.tokenEndpoints.length > 0
            ? this.options.tokenEndpoints
            : defaultEndpoints;
    }
    static defaultScopes = [
        'structures.edit',
        'structures.view',
        'pucks.view',
        'pucks.edit',
        'vents.view',
        'vents.edit',
        'users.view',
    ];
    async getUsers() {
        const response = await this.request(() => this.http.get('/api/users'));
        return response.data.data.map((entry) => new flair_api_ts_1.User().fromJSON(entry));
    }
    async getStructures() {
        const response = await this.request(() => this.http.get('/api/structures'));
        return response.data.data.map((entry) => new flair_api_ts_1.Structure().fromJSON(entry));
    }
    async getStructure(structure) {
        const response = await this.request(() => this.http.get(`/api/structures/${structure.id}`));
        return structure.fromJSON(response.data.data);
    }
    async getPrimaryStructure() {
        const structures = await this.getStructures();
        if (structures.length === 1) {
            return structures[0];
        }
        const primary = structures.find((item) => item.isPrimaryHome());
        if (!primary) {
            throw new Error('No primary structure found for Flair account');
        }
        return primary;
    }
    async setStructureMode(structure, mode) {
        const response = await this.request(() => this.http.patch(`/api/structures/${structure.id}`, {
            data: {
                type: flair_api_ts_1.Structure.type,
                attributes: {
                    mode,
                },
                relationships: {},
            },
        }));
        return structure.fromJSON(response.data.data);
    }
    async setStructureHeatingCoolMode(structure, mode) {
        const response = await this.request(() => this.http.patch(`/api/structures/${structure.id}`, {
            data: {
                type: flair_api_ts_1.Structure.type,
                attributes: {
                    'structure-heat-cool-mode': mode,
                },
                relationships: {},
            },
        }));
        return structure.fromJSON(response.data.data);
    }
    async setStructureSetPoint(structure, setPointC) {
        const response = await this.request(() => this.http.patch(`/api/structures/${structure.id}`, {
            data: {
                type: flair_api_ts_1.Structure.type,
                attributes: {
                    'set-point-temperature-c': setPointC,
                },
                relationships: {},
            },
        }));
        return structure.fromJSON(response.data.data);
    }
    async setStructureCallbackUrl(structure, callbackUrl) {
        const response = await this.request(() => this.http.patch(`/api/structures/${structure.id}`, {
            data: {
                type: flair_api_ts_1.Structure.type,
                attributes: {
                    'callback-url': callbackUrl ?? null,
                },
                relationships: {},
            },
        }));
        return structure.fromJSON(response.data.data);
    }
    async getRooms() {
        const response = await this.request(() => this.http.get('/api/rooms'));
        return response.data.data.map((entry) => new flair_api_ts_1.Room().fromJSON(entry));
    }
    async getRoom(room) {
        const response = await this.request(() => this.http.get(`/api/rooms/${room.id}`));
        return room.fromJSON(response.data.data);
    }
    async setRoomSetPoint(room, setPointC) {
        const response = await this.request(() => this.http.patch(`/api/rooms/${room.id}`, {
            data: {
                type: flair_api_ts_1.Room.type,
                attributes: {
                    'set-point-c': setPointC,
                },
                relationships: {},
            },
        }));
        return room.fromJSON(response.data.data);
    }
    async setRoomAway(room, setAway) {
        const response = await this.request(() => this.http.patch(`/api/rooms/${room.id}`, {
            data: {
                type: flair_api_ts_1.Room.type,
                attributes: {
                    active: !setAway,
                },
                relationships: {},
            },
        }));
        return room.fromJSON(response.data.data);
    }
    async getPucks() {
        const response = await this.request(() => this.http.get('/api/pucks'));
        return response.data.data.map((entry) => new flair_api_ts_1.Puck().fromJSON(entry));
    }
    async getPuckReading(puck) {
        const response = await this.request(() => this.http.get(`/api/pucks/${puck.id}/current-reading`));
        puck.setCurrentReading(response.data.data);
        return puck;
    }
    async getVents() {
        const response = await this.request(() => this.http.get('/api/vents'));
        return response.data.data.map((entry) => new flair_api_ts_1.Vent().fromJSON(entry));
    }
    async getVentReading(vent) {
        const response = await this.request(() => this.http.get(`/api/vents/${vent.id}/current-reading`));
        vent.setCurrentReading(response.data.data);
        return vent;
    }
    async setVentPercentOpen(vent, percentOpen) {
        const response = await this.request(() => this.http.patch(`/api/vents/${vent.id}`, {
            data: {
                type: flair_api_ts_1.Vent.type,
                attributes: {
                    'percent-open': percentOpen,
                },
                relationships: {},
            },
        }));
        vent.fromJSON(response.data.data);
        return vent;
    }
    async request(fn) {
        await this.ensureAccessToken();
        try {
            return await fn();
        }
        catch (error) {
            if (this.isAuthError(error)) {
                await this.ensureAccessToken(true);
                return fn();
            }
            throw error;
        }
    }
    async ensureAccessToken(forceRefresh = false) {
        if (this.pendingAuth) {
            await this.pendingAuth;
            if (!forceRefresh && this.token && !this.isTokenExpired(this.token)) {
                this.applyAuthHeader(this.token);
                return;
            }
        }
        if (!forceRefresh && this.token && !this.isTokenExpired(this.token)) {
            this.applyAuthHeader(this.token);
            return;
        }
        this.pendingAuth = this.acquireToken(forceRefresh);
        try {
            await this.pendingAuth;
        }
        finally {
            this.pendingAuth = undefined;
        }
    }
    async acquireToken(forceRefresh) {
        if (forceRefresh) {
            this.options.logger?.debug('Forcing Flair OAuth token refresh');
        }
        if (this.token?.refreshToken) {
            try {
                await this.refreshAccessToken();
                return;
            }
            catch (error) {
                this.options.logger?.warn?.('Failed to refresh Flair OAuth token, requesting a new token.', this.safeErrorMessage(error));
            }
        }
        await this.requestInitialToken();
    }
    async refreshAccessToken() {
        if (!this.token?.refreshToken) {
            throw new Error('No refresh token available');
        }
        const params = new URLSearchParams();
        params.append('grant_type', 'refresh_token');
        params.append('refresh_token', this.token.refreshToken);
        params.append('scope', this.scopes.join(' '));
        const token = await this.postTokenRequest(params);
        this.setTokenState(token);
    }
    async requestInitialToken() {
        const attempts = this.buildGrantAttempts();
        let lastError;
        for (const attempt of attempts) {
            try {
                const params = attempt.buildParams();
                params.append('scope', this.scopes.join(' '));
                const token = await this.postTokenRequest(params);
                this.setTokenState(token);
                return;
            }
            catch (error) {
                lastError = error;
                if (!this.shouldTryNextGrant(error)) {
                    throw error;
                }
                this.options.logger?.warn?.(`Grant ${attempt.name} failed: ${this.safeErrorMessage(error)}. Trying next option.`);
            }
        }
        throw lastError ?? new Error('Unable to acquire Flair OAuth token');
    }
    setTokenState(token) {
        const expiresAt = new Date(Date.now() + Math.max(0, token.expires_in - TOKEN_EXPIRY_BUFFER_SECONDS) * 1000);
        this.token = {
            accessToken: token.access_token,
            tokenType: token.token_type,
            refreshToken: token.refresh_token,
            scope: token.scope,
            expiresAt,
        };
        this.applyAuthHeader(this.token);
    }
    isTokenExpired(token) {
        return token.expiresAt.getTime() <= Date.now();
    }
    applyAuthHeader(token) {
        this.http.defaults.headers.common.Authorization = `${token.tokenType} ${token.accessToken}`;
    }
    getBasicAuthHeader() {
        const credentials = `${this.options.clientId}:${this.options.clientSecret}`;
        return `Basic ${Buffer.from(credentials).toString('base64')}`;
    }
    buildGrantAttempts() {
        const attempts = [];
        const configuredGrant = this.options.grantType;
        if (configuredGrant) {
            attempts.push(this.createGrantAttempt(configuredGrant));
            return this.dedupeGrantAttempts(attempts);
        }
        attempts.push(this.createGrantAttempt('client_credentials'));
        if (this.options.username && this.options.password) {
            attempts.push(this.createGrantAttempt('password'));
            attempts.push(this.createGrantAttempt('password-realm'));
        }
        return this.dedupeGrantAttempts(attempts);
    }
    createGrantAttempt(grantType) {
        const normalizedGrant = this.normalizeGrantType(grantType);
        return {
            name: normalizedGrant,
            grantType: normalizedGrant,
            buildParams: () => {
                const params = new URLSearchParams();
                if (normalizedGrant === 'password') {
                    if (!this.options.username || !this.options.password) {
                        throw new Error('Username and password are required when using the password grant type.');
                    }
                    params.append('grant_type', 'password');
                    params.append('username', this.options.username);
                    params.append('password', this.options.password);
                }
                else if (normalizedGrant === 'http://auth0.com/oauth/grant-type/password-realm') {
                    if (!this.options.username || !this.options.password) {
                        throw new Error('Username and password are required when using the password realm grant type.');
                    }
                    params.append('grant_type', 'http://auth0.com/oauth/grant-type/password-realm');
                    params.append('username', this.options.username);
                    params.append('password', this.options.password);
                    params.append('realm', this.realm ?? 'Username-Password-Authentication');
                }
                else {
                    params.append('grant_type', normalizedGrant);
                }
                params.append('client_id', this.options.clientId);
                params.append('client_secret', this.options.clientSecret);
                return params;
            },
        };
    }
    normalizeGrantType(grantType) {
        if (grantType === 'password' || grantType === 'client_credentials') {
            return grantType;
        }
        if (grantType === 'password-realm') {
            return 'http://auth0.com/oauth/grant-type/password-realm';
        }
        return grantType;
    }
    dedupeGrantAttempts(attempts) {
        const seen = new Set();
        const result = [];
        for (const attempt of attempts) {
            if (seen.has(attempt.grantType)) {
                continue;
            }
            seen.add(attempt.grantType);
            result.push(attempt);
        }
        return result;
    }
    shouldTryNextGrant(error) {
        if (!axios_1.default.isAxiosError(error)) {
            return false;
        }
        const response = error.response;
        if (!response) {
            return false;
        }
        const code = response.data?.error;
        return code === 'unsupported_grant_type'
            || code === 'invalid_grant'
            || code === 'invalid_request'
            || code === 'invalid_client';
    }
    async postTokenRequest(params) {
        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: this.getBasicAuthHeader(),
        };
        const body = params.toString();
        let lastError;
        for (const endpoint of this.tokenEndpoints) {
            try {
                const response = await this.http.post(endpoint, body, { headers });
                return response.data;
            }
            catch (error) {
                lastError = error;
                if (!axios_1.default.isAxiosError(error)) {
                    continue;
                }
                if (!error.response) {
                    continue;
                }
                const isLastEndpoint = endpoint === this.tokenEndpoints[this.tokenEndpoints.length - 1];
                const errorCode = error.response.data?.error;
                const shouldRetry = !isLastEndpoint && (error.response.status === 404 ||
                    error.response.status === 401 ||
                    errorCode === 'unsupported_grant_type');
                if (shouldRetry) {
                    this.options.logger?.debug?.(`Retrying token request against fallback endpoint: ${endpoint} (error: ${errorCode ?? error.response.status})`);
                    continue;
                }
                throw error;
            }
        }
        throw lastError ?? new Error('Unknown error requesting Flair OAuth token');
    }
    isAuthError(error) {
        return axios_1.default.isAxiosError(error) && error.response?.status === 401;
    }
    safeErrorMessage(error) {
        if (axios_1.default.isAxiosError(error)) {
            const axiosError = error;
            const serverMessage = axiosError.response?.data?.error_description || axiosError.response?.data?.error;
            return serverMessage ?? axiosError.message;
        }
        if (error instanceof Error) {
            return error.message;
        }
        return String(error);
    }
}
exports.FlairApiClient = FlairApiClient;
//# sourceMappingURL=flairApiClient.js.map