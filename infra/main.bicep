@description('Name of the Static Web App')
param name string = 'swa-psi-process-map'

@description('Location for the Static Web App')
param location string = 'westeurope'

resource staticWebApp 'Microsoft.Web/staticSites@2023-12-01' = {
  name: name
  location: location
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    repositoryUrl: 'https://github.com/kevs4n/psi-process-map'
    branch: 'master'
    buildProperties: {
      appLocation: '/'
      outputLocation: 'dist'
    }
  }
}

output staticWebAppName string = staticWebApp.name
output defaultHostname string = staticWebApp.properties.defaultHostname
