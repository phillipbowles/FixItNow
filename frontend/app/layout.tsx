import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FixItNow - Encuentra profesionales cerca de ti',
  description: 'Plataforma de servicios profesionales bajo demanda',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
        
        <footer className="bg-gray-900 text-white mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4">FixItNow</h3>
                <p className="text-gray-400">
                  Conectando usuarios con profesionales de calidad
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Servicios</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>Plomería</li>
                  <li>Electricidad</li>
                  <li>Carpintería</li>
                  <li>Limpieza</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Empresa</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>Sobre Nosotros</li>
                  <li>Conviértete en Proveedor</li>
                  <li>Blog</li>
                  <li>Contacto</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Legal</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>Términos de Servicio</li>
                  <li>Política de Privacidad</li>
                  <li>Cookies</li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
              <p>&copy; 2025 FixItNow. Proyecto académico - Sistemas Distribuidos.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
