Plan de Arquitectura para el Proyecto "ServiciosYa"
Este plan propone una Arquitectura de Microservicios para ServiciosYa, alineada con los conceptos de Sistemas Distribuidos (SD) estudiados en el curso, incluyendo Arquitectura, Comunicación y Buenas Prácticas (12Factor).

1.⁠ ⁠Arquitectura Propuesta: Microservicios y EDA
El diseño se basa en una arquitectura de Microservicios para manejar la complejidad inherente a las tres grandes áreas funcionales (Usuarios/Proveedores, Solicitudes, y Administración) y permitir el escalado independiente de cada componente.

Componentes Clave (Microservicios)
Servicio de Autenticación y Perfiles (AuthService):

Maneja el registro, inicio de sesión (usuarios, proveedores, admin) y la gestión de perfiles.

Modelo Fundamental: Separación de Intereses.

Servicio de Catálogo y Servicios (CatalogService):

Almacena y gestiona la información de los servicios ofrecidos por los proveedores.

Servicio de Solicitudes y Reservas (BookingService):

Maneja el ciclo de vida de una solicitud de servicio (creación, aceptación, finalización, pago).

Servicio de Notificaciones (NotificationService):

Escucha eventos y envía alertas (email, push, etc.) a usuarios y proveedores.

Servicio de Administración (AdminService):

API dedicada para el panel de administración, con acceso a métricas y moderación.

Integración y Despliegue
| Concepto del Curso | Aplicación en ServiciosYa | Tema Cubierto |
| Orquestación | Usar Kubernetes para el despliegue de cada microservicio, garantizando alta disponibilidad y escalado automático. | TEMA 3 (Kubernetes) |
| Buenas Prácticas | Cada microservicio debe seguir la metodología 12Factor App (configuración a través de variables de entorno, logs como event streams, separación estricta de las etapas de build/release/run). | TEMA 2 (12Factor) |
| Aprovisionamiento | Usar Docker y docker-compose para la simulación de la arquitectura en el entorno de desarrollo local. | TEMA 2 (Docker) |

2.⁠ ⁠Estrategia de Comunicación (TEMA 4)
Se utilizará una combinación de modelos de comunicación para optimizar la interacción, la eficiencia y la resiliencia del sistema.

A. Comunicación Síncrona (Frontend ↔️ Backend / Service ↔️ Service)
| Modelo | Uso en ServiciosYa | Ventaja |
| API Gateway (REST) | Comunicación Externa: El Admin Panel y las aplicaciones móviles de Usuarios/Proveedores se conectarán a un API Gateway que expone APIs REST sencillas para las operaciones CRUD básicas. | Simplicidad y estándar de la web. |
| gRPC | Comunicación Interna: Para la comunicación de alto rendimiento y baja latencia entre microservicios (Ej: BookingService consulta a AuthService para verificar la identidad del proveedor). | Eficiencia (basado en HTTP/2 y Protocol Buffers). |
| GraphQL | Opcional para el Frontend: Puede usarse para el catálogo, permitiendo al frontend solicitar solo los datos exactos que necesita, minimizando las consultas. | Minimiza la sobrecarga de datos. |

B. Comunicación Asíncrona (Arquitectura Dirigida por Eventos - EDA)
Se implementará un Message Broker (RabbitMQ o Kafka) para desacoplar los servicios.

Publicador de Eventos: El BookingService publica un evento llamado REQUEST_CREATED.

Suscriptor de Eventos: El NotificationService y el AdminService (para actualizar métricas) se suscriben al evento REQUEST_CREATED.

| Evento de Ejemplo | Publicador | Suscriptores | TEMA Cubierto |
| SERVICE_REQUESTED | BookingService | NotificationService (avisa al proveedor), AdminService (registra métrica). | TEMA 3 (EDA) |
| PROFILE_UPDATED | AuthService | CatalogService (actualiza el proveedor del servicio). | TEMA 4 (RabbitMQ/Kafka) |

C. Comunicación en Tiempo Real (WebSockets)
| Modelo | Uso en ServiciosYa | Ventaja |
| WebSockets | Interacciones de Baja Latencia: Usado para funciones clave como Chat en Vivo entre el Proveedor y el Usuario una vez aceptada una solicitud, o para Actualizaciones de Estado en Vivo (ej., "El proveedor está en camino"). | Comunicación bidireccional y persistente (full-duplex), ideal para tiempo real. |

3.⁠ ⁠Enfoque para el Trabajo Práctico Obligatorio (30%)
El plan anterior aborda directamente las áreas requeridas para el informe final del proyecto:

| Requisito del Informe | Cómo lo aborda el Plan |
| Características Clave y Modelos Fundamentales | Cobertura de las características de los SD (tolerancia a fallos, escalabilidad) mediante Microservicios, y modelos como Cliente-Servidor y P2P (aunque el P2P es bajo el enfoque de Microservicios). |
| Arquitectura | Propuesta formal de Microservicios y Arquitectura Dirigida por Eventos (EDA), detallando los servicios, la orquestación con Kubernetes y las buenas prácticas de 12Factor. |
| Comunicación Distribuida | Uso de gRPC (síncrona interna de alto rendimiento), RabbitMQ/Kafka (asíncrona con EDA) y WebSockets (tiempo real) para demostrar el uso de múltiples tecnologías de comunicación. |
| Monitorización y Observabilidad | Los logs de cada servicio, siguiendo el principio de 12Factor, serán gestionados centralmente (ej. por Prometheus/Grafana) junto con las métricas publicadas por los servicios, garantizando la Observabilidad. |