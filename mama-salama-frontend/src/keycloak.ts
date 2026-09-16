import Keycloak from 'keycloak-js'

declare global {
  interface Window {
    _env_?: { KEYCLOAK_URL?: string }
  }
}

const keycloakUrl =
  window._env_?.KEYCLOAK_URL ||
  import.meta.env.VITE_KEYCLOAK_URL ||
  'http://localhost:8090'

const keycloak = new Keycloak({
  url: keycloakUrl,
  realm: 'mama-salama',
  clientId: 'mama-salama-frontend',
})

keycloak.onTokenExpired = () => {
  keycloak.updateToken(30).catch(() => {
    keycloak.logout()
  })
}

export default keycloak
