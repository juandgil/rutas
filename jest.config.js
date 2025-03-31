module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/src/tests/test-setup.ts'],
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  collectCoverageFrom: [
    // Servicios de Aplicación
    'src/application/services/*.ts',
    
    // Repositorios
    'src/infrastructure/repositories/*.impl.ts',
    
    // Controladores
    'src/interfaces/controllers/*.ts',
    
    // APIs Externas
    'src/infrastructure/external-apis/*.mock.ts',
    
    // Servicios de Infraestructura
    'src/infrastructure/cache/*.ts',
    'src/infrastructure/pubsub/*.ts'
  ],
  coveragePathIgnorePatterns: [
    // Archivos de configuración
    '/node_modules/',
    '/dist/',
    '/coverage/',
    'src/infrastructure/config/',
    'jest.config.js',
    'tsconfig.json',
    
    // Entidades y DTOs
    'src/domain/entities/',
    'src/application/dtos/',
    
    // Interfaces
    'src/domain/interfaces/',
    'src/application/interfaces/',
    
    // Documentación y Schemas
    'src/infrastructure/swagger/',
    
    // Archivos de inicialización
    'src/index.ts',
    'src/server.ts',
    
    // Archivos de prueba
    'src/tests/',
    
    // Archivos de ambiente
    '.env',
    '.env.*'
  ]
}; 