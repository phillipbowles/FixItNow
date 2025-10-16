'use client'

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Encuentra el Profesional que Necesitas
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Conectamos usuarios con los mejores proveedores de servicios
            </p>
            
            <div className="max-w-3xl mx-auto">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="¿Qué servicio necesitas? (ej: plomero, electricista...)"
                  className="flex-1 px-6 py-4 rounded-lg text-gray-900 text-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <button className="px-8 py-4 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold rounded-lg transition">
                  Buscar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
              <div>
                <div className="text-4xl font-bold">250+</div>
                <div className="text-blue-200">Servicios</div>
              </div>
              <div>
                <div className="text-4xl font-bold">1420+</div>
                <div className="text-blue-200">Proveedores</div>
              </div>
              <div>
                <div className="text-4xl font-bold">15800+</div>
                <div className="text-blue-200">Trabajos Completados</div>
              </div>
              <div>
                <div className="text-4xl font-bold">4.8</div>
                <div className="text-blue-200">Calificación Promedio</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              ¿Por Qué Elegirnos?
            </h2>
            <p className="text-xl text-gray-600">
              Calidad, confianza y conveniencia en cada servicio
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Profesionales Verificados
              </h3>
              <p className="text-gray-600">
                Todos nuestros proveedores están verificados y calificados
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Servicio Rápido
              </h3>
              <p className="text-gray-600">
                Obtén respuestas en minutos y agenda cuando te convenga
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⭐</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Mejor Valorados
              </h3>
              <p className="text-gray-600">
                Accede a reviews y calificaciones reales de clientes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">
            ¿Eres un Profesional?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Únete a nuestra red de proveedores y encuentra más clientes
          </p>
          <div className="flex gap-4 justify-center">
            <button className="px-8 py-4 bg-white hover:bg-gray-100 text-blue-600 font-semibold rounded-lg transition">
              Registrarme como Proveedor
            </button>
            <button className="px-8 py-4 bg-transparent border-2 border-white hover:bg-white hover:text-blue-600 font-semibold rounded-lg transition">
              Más Información
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
