/* Glosario de la guía virtual: conceptos de ciencia, calidad y seguridad alimentaria.
   Cada tema trae:
     · claves    → palabras que la persona puede escribir (sin acentos ni mayúsculas, se comparan normalizadas)
     · ejemplos  → formas distintas de preguntar lo mismo (también sirven para reconocer preguntas parecidas)
     · respuesta → texto corto y general (nada de límites ni cifras que cambien con la norma)
     · cursos    → palabras para mostrar los cursos de la plataforma que tratan el tema
     · destacado → aparece como botón en "Aprender un concepto"
   Es información general y orientativa; no sustituye la asesoría de un especialista. */
window.AF_GLOSARIO = [
  {
    id: 'haccp', tema: 'HACCP (APPCC)', destacado: true,
    claves: ['haccp', 'appcc', 'apcc', 'puntos criticos', 'puntos criticos de control', 'analisis de peligros'],
    ejemplos: ['¿Qué es el HACCP?', '¿Para qué sirve el HACCP?', '¿Qué significa APPCC?', 'Explícame el análisis de peligros y puntos críticos de control', '¿Cuáles son los principios del HACCP?', '¿Qué es un punto crítico de control?', '¿Cómo se implementa un plan HACCP?', '¿Es obligatorio el HACCP?'],
    respuesta: [
      '**HACCP** (en español **APPCC**: Análisis de Peligros y Puntos Críticos de Control) es un sistema **preventivo** para asegurar la inocuidad de los alimentos.',
      'Identifica los peligros que pueden aparecer en cada etapa del proceso (biológicos, químicos o físicos) y define **puntos críticos** donde hay que controlarlos con límites, monitoreo y acciones correctivas. Se basa en 7 principios del Codex Alimentarius.'
    ],
    cursos: ['haccp', 'peligros', 'iso 22000']
  },
  {
    id: 'bpm', tema: 'Buenas prácticas de manufactura (BPM)', destacado: true,
    claves: ['bpm', 'buenas practicas', 'buenas practicas de manufactura', 'gmp', 'nom-251', 'nom 251', 'nom251', 'practicas de higiene'],
    ejemplos: ['¿Qué son las BPM?', '¿Qué son las buenas prácticas de manufactura?', '¿Para qué sirven las BPM?', '¿Qué es la NOM-251?', '¿Qué incluyen las buenas prácticas de higiene?', '¿Cómo implemento BPM en mi planta?'],
    respuesta: [
      'Las **BPM** (Buenas Prácticas de Manufactura) son el conjunto de reglas de higiene y control para producir alimentos **seguros**: cuidan al personal, las instalaciones, los equipos, la limpieza, el manejo de materias primas y el control de plagas.',
      'En México, la **NOM-251-SSA1-2009** establece los requisitos de higiene para el proceso de alimentos, bebidas y suplementos alimenticios. Las BPM son la base sobre la que se construye un plan HACCP.'
    ],
    cursos: ['bpm', 'buenas practicas', 'higiene', 'inocuidad']
  },
  {
    id: 'inocuidad', tema: 'Inocuidad alimentaria', destacado: true,
    claves: ['alimento seguro', 'inocuidad', 'inocuo', 'alimento inocuo', 'seguridad alimentaria', 'alimentos seguros'],
    ejemplos: ['¿Qué es la inocuidad?', '¿Qué significa inocuidad alimentaria?', '¿Qué es un alimento inocuo?', '¿Qué es la seguridad alimentaria?', '¿Por qué es importante la inocuidad?', '¿Qué peligros afectan la inocuidad?'],
    respuesta: [
      'La **inocuidad** es la garantía de que un alimento **no hará daño** a la salud de quien lo consume, siempre que se prepare y se coma como se espera.',
      'Se logra controlando los peligros que pueden contaminarlo: **biológicos** (bacterias, virus, parásitos), **químicos** (residuos, limpiadores, toxinas) y **físicos** (vidrio, metal, plástico).'
    ],
    cursos: ['inocuidad', 'seguridad alimentaria', 'gestion']
  },
  {
    id: 'calidad', tema: 'Calidad vs. inocuidad',
    claves: ['calidad y seguridad alimentaria', 'calidad y seguridad', 'control de calidad', 'aseguramiento de calidad', 'diferencia entre calidad', 'calidad e inocuidad', 'calidad de los alimentos', 'calidad alimentaria'],
    ejemplos: ['¿Qué es la calidad de los alimentos?', '¿Cuál es la diferencia entre calidad e inocuidad?', '¿Qué es el control de calidad?', '¿Qué hace un encargado de calidad?', '¿Qué es el aseguramiento de la calidad?', 'Calidad y seguridad alimentaria, ¿es lo mismo?'],
    respuesta: [
      'La **inocuidad** responde a "¿hace daño?"; la **calidad** responde a "¿cumple lo que se espera?": sabor, aspecto, composición, vida útil y especificaciones del producto o del cliente.',
      'Un alimento puede ser inocuo pero de mala calidad; en cambio, un alimento **no inocuo** nunca se considera de calidad. El **control de calidad** revisa el producto; el **aseguramiento de calidad** organiza el sistema para que salga bien siempre.'
    ],
    cursos: ['calidad', 'muestreo', 'gestion']
  },
  {
    id: 'nom051', tema: 'NOM-051 (etiquetado)', destacado: true,
    claves: ['etiquetar mi producto', 'etiquetar un producto', 'etiquetar', 'nom-051', 'nom 051', 'nom051', 'etiquetado frontal', 'etiquetado de alimentos', 'etiquetado nutrimental', 'etiquetado nutricional', 'etiquetas'],
    ejemplos: ['¿Qué es la NOM-051?', '¿Qué regula la NOM-051?', '¿Cómo debe etiquetarse un alimento en México?', '¿Qué es el etiquetado frontal?', '¿Qué información debe llevar la etiqueta de un producto?', '¿Qué cambió en 2020 con el etiquetado?'],
    respuesta: [
      'La **NOM-051** regula cómo deben **etiquetarse los alimentos y bebidas no alcohólicas preenvasados** en México (información comercial y nutrimental).',
      'Con su modificación de 2020 se incorporó el **etiquetado frontal**: sellos de advertencia cuando el producto excede ciertos límites, además de leyendas precautorias (por ejemplo, contiene cafeína o edulcorantes).'
    ],
    cursos: ['nom-051', 'etiquetado', 'nutricional']
  },
  {
    id: 'sellos', tema: 'Sellos de advertencia',
    claves: ['sellos', 'sello de advertencia', 'sellos de advertencia', 'octagono', 'octagonos', 'exceso de azucares', 'exceso de sodio', 'exceso calorias', 'leyendas precautorias'],
    ejemplos: ['¿Qué son los sellos de advertencia?', '¿Cuáles son los sellos negros de los productos?', '¿Qué significa exceso de azúcares?', '¿Cuántos sellos existen?', '¿Cuándo un producto lleva sello?', '¿Qué significan los octágonos negros?', '¿Qué productos deben llevar sellos?'],
    respuesta: [
      'Son **octágonos negros** en el frente del empaque que avisan cuando un producto tiene **exceso** de algún componente. Los sellos son cinco: **calorías, azúcares, grasas saturadas, grasas trans y sodio**.',
      'También hay leyendas precautorias, como "contiene cafeína, evitar en niños" o "contiene edulcorantes, no recomendable en niños". Forman parte de la NOM-051.'
    ],
    cursos: ['nom-051', 'etiquetado']
  },
  {
    id: 'tabla-nutrimental', tema: 'Información nutrimental',
    claves: ['tabla nutrimental', 'informacion nutrimental', 'tabla nutricional', 'tabla de nutricion', 'calcular nutrientes', 'calculo nutrimental', 'valores nutrimentales'],
    ejemplos: ['¿Qué es la tabla nutrimental?', '¿Cómo se calcula la tabla nutricional de un producto?', '¿Qué datos lleva la información nutrimental?', '¿Cómo calculo las calorías de mi producto?', '¿Cómo leer una tabla nutrimental?'],
    respuesta: [
      'La **información nutrimental** es la tabla de la etiqueta que indica cuánta energía y qué nutrientes aporta el producto (por ejemplo grasas, azúcares y sodio), por porción y por cada 100 g o 100 ml.',
      'Se calcula a partir de la formulación o de análisis de laboratorio, y debe cumplir lo que marca la NOM-051.'
    ],
    cursos: ['nutricional', 'nom-051', 'etiquetado']
  },
  {
    id: 'distintivo-h', tema: 'Distintivo H',
    claves: ['distintivo h', 'distintivo-h', 'distintivo higiene', 'sello h'],
    ejemplos: ['¿Qué es el Distintivo H?', '¿Cómo obtengo el Distintivo H?', '¿Para quién es el Distintivo H?', '¿Qué requisitos pide el Distintivo H?', '¿Qué restaurantes tienen Distintivo H?'],
    respuesta: [
      'El **Distintivo H** es un reconocimiento que otorga la Secretaría de Turismo a **restaurantes y establecimientos de alimentos y bebidas** que cumplen buenas prácticas de higiene en el manejo de los alimentos.',
      'Se obtiene tras capacitar al personal, aplicar las prácticas de higiene y pasar una auditoría.'
    ],
    cursos: ['distintivo h', 'higiene']
  },
  {
    id: 'microbiologia', tema: 'Microbiología de los alimentos', destacado: true,
    claves: ['microbiologia', 'microbiologico', 'microorganismos', 'microorganismo', 'bacterias', 'bacteria', 'hongos', 'moho', 'levaduras', 'virus en alimentos'],
    ejemplos: ['¿Qué es la microbiología de alimentos?', '¿Qué estudia la microbiología?', '¿Qué bacterias hay en los alimentos?', '¿Todas las bacterias son malas?', '¿Por qué se echan a perder los alimentos?', '¿Qué es un análisis microbiológico?', '¿Qué es el moho en los alimentos?'],
    respuesta: [
      'La **microbiología de alimentos** estudia los microorganismos (bacterias, levaduras, mohos y virus) que **contaminan o echan a perder** los alimentos, y también los que sirven para **elaborarlos** (como en el yogur, el pan o la cerveza).',
      'Sirve para saber si un alimento es seguro, cuánto tiempo se conserva y qué controles aplicar en la producción.'
    ],
    cursos: ['microbio', 'patogeno', 'inocuidad']
  },
  {
    id: 'patogenos', tema: 'Patógenos más comunes',
    claves: ['bacterias que enferman', 'bacterias peligrosas', 'bacterias patogenas', 'patogeno', 'patogenos', 'salmonella', 'salmonela', 'listeria', 'e coli', 'ecoli', 'staphylococcus', 'estafilococo', 'campylobacter', 'botulismo', 'intoxicacion', 'enfermedades transmitidas por alimentos', 'eta'],
    ejemplos: ['¿Qué es un patógeno?', '¿Qué es la Salmonella?', '¿Qué es la Listeria?', '¿Qué es E. coli?', '¿Cuáles son las bacterias que enferman por alimentos?', '¿Qué es una intoxicación alimentaria?', '¿Qué es el botulismo?', '¿Qué son las enfermedades transmitidas por alimentos?'],
    respuesta: [
      'Un **patógeno** es un microorganismo que puede causar enfermedad. Entre los más conocidos en alimentos están **Salmonella**, **Listeria monocytogenes**, **E. coli** (cepas patógenas), **Staphylococcus aureus**, **Campylobacter** y **Clostridium botulinum**.',
      'Se previenen con higiene, control de temperaturas, cocción adecuada y evitando la contaminación cruzada. Cuando alguien enferma por comer un alimento contaminado se habla de una **enfermedad transmitida por alimentos (ETA)**.'
    ],
    cursos: ['patogeno', 'microbio', 'deteccion']
  },
  {
    id: 'coliformes', tema: 'Coliformes e indicadores de higiene',
    claves: ['microorganismos indicadores', 'coliformes', 'coliforme', 'indicador de higiene', 'indicadores microbiologicos', 'mesofilos', 'mesofilos aerobios'],
    ejemplos: ['¿Qué son los coliformes?', '¿Para qué sirven los coliformes?', '¿Qué son los microorganismos indicadores?', '¿Qué son los mesófilos aerobios?', '¿Cómo sé si un proceso está limpio?'],
    respuesta: [
      'Los **coliformes** son un grupo de bacterias que se usa como **indicador de higiene**: si aparecen en cantidad, sugieren falta de limpieza o contaminación durante el proceso. Algunos grupos indican posible contaminación de origen fecal.',
      'Los indicadores no siempre son peligrosos por sí mismos: son una señal para revisar el proceso y el nivel de higiene.'
    ],
    cursos: ['microbio', 'agua', 'ufc']
  },
  {
    id: 'ufc', tema: 'UFC (conteo en placa)',
    claves: ['contar bacterias', 'cuentan las bacterias', 'conteo de bacterias', 'contar microorganismos', 'dilucion en microbiologia', 'ufc', 'unidades formadoras de colonias', 'conteo en placa', 'cuenta en placa', 'dilucion', 'diluciones', 'colonias'],
    ejemplos: ['¿Qué son las UFC?', '¿Qué significa UFC por gramo?', '¿Cómo se cuentan las bacterias en un alimento?', '¿Cómo se hace un conteo en placa?', '¿Qué es una dilución en microbiología?', '¿Cómo se calculan las UFC?'],
    respuesta: [
      '**UFC** significa **Unidades Formadoras de Colonias**: es la forma de contar los microorganismos **vivos** de una muestra. Cada colonia que crece en la placa viene de una célula (o grupo de células) viable.',
      'Se siembra la muestra en diluciones y, al contar las colonias, se calcula cuántas UFC hay por gramo o por mililitro. En el panel de Alintec Food hay una calculadora de microbiología UFC.'
    ],
    cursos: ['microbio', 'ufc']
  },
  {
    id: 'vida-anaquel', tema: 'Vida de anaquel (vida útil)',
    claves: ['vida de anaquel', 'vida util', 'shelf life', 'cuanto dura un alimento', 'cuanto tiempo dura', 'deterioro', 'estabilidad del producto'],
    ejemplos: ['¿Qué es la vida de anaquel?', '¿Cómo se determina la vida útil de un alimento?', '¿Cuánto tiempo dura un producto?', '¿Qué es el shelf life?', '¿Por qué se deteriora un alimento?', '¿Cómo alargar la vida útil de mi producto?', '¿Qué es un estudio de vida de anaquel?'],
    respuesta: [
      'La **vida de anaquel** (o vida útil) es el tiempo en que un alimento conserva su **inocuidad y calidad** bajo condiciones de almacenamiento definidas.',
      'Se determina con pruebas microbiológicas, fisicoquímicas y sensoriales, y a veces con pruebas aceleradas (modelos como Q10 o Arrhenius). Depende de la formulación, el empaque y la temperatura. En el panel hay un estimador de vida de anaquel.'
    ],
    cursos: ['vida util', 'conservacion', 'perecederos']
  },
  {
    id: 'caducidad', tema: 'Fecha de caducidad vs. consumo preferente',
    claves: ['fecha de caducidad', 'caducidad', 'consumir preferentemente', 'consumo preferente', 'fecha de consumo preferente', 'caduco'],
    ejemplos: ['¿Qué es la fecha de caducidad?', '¿Qué diferencia hay entre caducidad y consumo preferente?', '¿Puedo consumir un producto caducado?', '¿Qué significa "consumir preferentemente antes de"?', '¿Cómo se define la fecha de caducidad?'],
    respuesta: [
      'La **fecha de caducidad** indica hasta cuándo el producto es seguro y conserva sus características: pasada esa fecha **no debe consumirse**. La **fecha de consumo preferente** indica hasta cuándo conserva su **calidad óptima**; después puede perder sabor o textura.',
      'El fabricante las define con estudios de vida de anaquel y deben aparecer en la etiqueta conforme a la norma.'
    ],
    cursos: ['vida util', 'etiquetado', 'conservacion']
  },
  {
    id: 'contaminacion-cruzada', tema: 'Contaminación cruzada',
    claves: ['contaminacion cruzada', 'cruzada', 'contaminacion', 'contaminar alimentos'],
    ejemplos: ['¿Qué es la contaminación cruzada?', '¿Cómo evito la contaminación cruzada?', '¿Cómo se contamina un alimento?', 'Ejemplos de contaminación cruzada', '¿Cómo se contaminan los alimentos en la cocina?'],
    respuesta: [
      'La **contaminación cruzada** ocurre cuando los microorganismos u otros contaminantes pasan de un alimento, una superficie, un utensilio o una persona a **otro alimento**; por ejemplo, de carne cruda a una verdura que se come cruda.',
      'Se previene separando crudos y cocidos, usando utensilios y tablas distintos, lavándose las manos con frecuencia y limpiando y desinfectando las superficies.'
    ],
    cursos: ['inocuidad', 'higiene', 'bpm']
  },
  {
    id: 'peligros', tema: 'Peligros: biológicos, químicos y físicos',
    claves: ['peligros', 'peligro fisico', 'peligro quimico', 'peligro biologico', 'peligros biologicos', 'peligros quimicos', 'peligros fisicos', 'tipos de peligros', 'cuerpos extraños'],
    ejemplos: ['¿Qué tipos de peligros hay en los alimentos?', '¿Qué es un peligro biológico?', '¿Qué es un peligro físico?', '¿Qué es un peligro químico?', '¿Qué es un cuerpo extraño en un alimento?', 'Ejemplos de peligros en alimentos'],
    respuesta: [
      'En inocuidad se clasifican en tres: **biológicos** (bacterias, virus, parásitos, hongos), **químicos** (residuos de plaguicidas, limpiadores, toxinas, alérgenos mal controlados) y **físicos** (vidrio, metal, plástico, madera, piedras).',
      'El plan HACCP los identifica en cada etapa del proceso para decidir cómo controlarlos.'
    ],
    cursos: ['inocuidad', 'haccp', 'peligros']
  },
  {
    id: 'trazabilidad', tema: 'Trazabilidad',
    claves: ['trazabilidad', 'rastreabilidad', 'retiro de producto', 'recall', 'lote', 'lotes'],
    ejemplos: ['¿Qué es la trazabilidad?', '¿Para qué sirve la trazabilidad en alimentos?', '¿Qué es un retiro de producto?', '¿Qué es un lote?', '¿Cómo rastreo un producto contaminado?', '¿Qué es un recall?'],
    respuesta: [
      'La **trazabilidad** es la capacidad de **seguir un producto** a lo largo de toda la cadena: de dónde vinieron sus ingredientes, cómo se procesó y a quién se distribuyó.',
      'Sirve para actuar rápido ante un problema: identificar el lote afectado y hacer un **retiro del mercado** sin tener que sacar todo el producto.'
    ],
    cursos: ['gestion', 'inocuidad', 'seguridad alimentaria']
  },
  {
    id: 'auditoria', tema: 'Auditorías de inocuidad',
    claves: ['auditoria de inocuidad', 'auditoria', 'auditorias', 'auditar', 'auditor', 'no conformidad', 'hallazgos', 'auditoria interna'],
    ejemplos: ['¿Qué es una auditoría de inocuidad?', '¿Cómo preparo una auditoría?', '¿Qué es una no conformidad?', '¿Qué diferencia hay entre auditoría interna y externa?', '¿Qué hace un auditor?', '¿Qué revisa una auditoría de BPM?'],
    respuesta: [
      'Una **auditoría** es una revisión sistemática que comprueba si se cumplen los requisitos (una norma, las BPM, el plan HACCP o los de un cliente). Puede ser **interna** (la hace tu propia empresa) o **externa** (un cliente o un organismo certificador).',
      'Si algo no cumple se registra como **no conformidad** y se corrige con una acción correctiva. Prepararse implica tener los registros, procedimientos y la planta en orden.'
    ],
    cursos: ['auditoria', 'gestion', 'iso 22000']
  },
  {
    id: 'iso22000', tema: 'ISO 22000',
    claves: ['iso 22000', 'iso22000', 'iso-22000', 'sistema de gestion de inocuidad'],
    ejemplos: ['¿Qué es la ISO 22000?', '¿Para qué sirve la ISO 22000?', '¿Cómo me certifico en ISO 22000?', '¿Qué diferencia hay entre ISO 22000 y HACCP?', '¿Qué es un sistema de gestión de inocuidad?'],
    respuesta: [
      'La **ISO 22000** es una norma internacional para **sistemas de gestión de la inocuidad alimentaria**. Reúne los principios del HACCP, los programas de prerrequisitos (como las BPM) y la gestión y comunicación a lo largo de la cadena alimentaria.',
      'Una empresa puede certificarse con un organismo acreditado para demostrar a clientes y autoridades que controla sus peligros de forma sistemática.'
    ],
    cursos: ['iso 22000', 'haccp', 'gestion']
  },
  {
    id: 'gfsi', tema: 'Certificaciones GFSI (FSSC 22000, BRCGS, SQF)',
    claves: ['gfsi', 'fssc', 'fssc 22000', 'brc', 'brcgs', 'sqf', 'certificacion de inocuidad', 'certificaciones de inocuidad'],
    ejemplos: ['¿Qué es el FSSC 22000?', '¿Qué es GFSI?', '¿Qué es BRC?', '¿Qué es SQF?', '¿Qué certificaciones de inocuidad existen?', '¿Cómo certifico mi planta?'],
    respuesta: [
      'La **GFSI** (Global Food Safety Initiative) reconoce esquemas de certificación de inocuidad que muchos clientes y cadenas comerciales exigen, como **FSSC 22000**, **BRCGS** y **SQF**.',
      'Cada esquema tiene sus propios requisitos y auditorías; todos se apoyan en HACCP y en programas de prerrequisitos como las BPM.'
    ],
    cursos: ['iso 22000', 'auditoria', 'gestion']
  },
  {
    id: 'codex', tema: 'Codex Alimentarius',
    claves: ['codex', 'codex alimentarius', 'fao', 'oms alimentos'],
    ejemplos: ['¿Qué es el Codex Alimentarius?', '¿Quién crea el Codex?', '¿Para qué sirve el Codex?', '¿Qué es el Codex en alimentos?'],
    respuesta: [
      'El **Codex Alimentarius** es una colección de normas, directrices y códigos de práctica **internacionales** sobre alimentos, creada por la FAO y la OMS.',
      'Sirve para proteger la salud de los consumidores y facilitar el comercio. De ahí vienen, por ejemplo, los principios del HACCP.'
    ],
    cursos: ['codex', 'haccp', 'validacion']
  },
  {
    id: 'cofepris', tema: 'COFEPRIS y autoridades sanitarias',
    claves: ['quien vigila', 'quien regula', 'autoridad de inocuidad', 'cofepris', 'permiso sanitario', 'aviso de funcionamiento', 'licencia sanitaria', 'autoridad sanitaria', 'profeco', 'secretaria de salud'],
    ejemplos: ['¿Qué es la COFEPRIS?', '¿Qué hace la COFEPRIS?', '¿Necesito permiso sanitario para vender alimentos?', '¿Qué es un aviso de funcionamiento?', '¿Quién vigila la inocuidad en México?', '¿Qué hace la PROFECO con los alimentos?'],
    respuesta: [
      'La **COFEPRIS** (Comisión Federal para la Protección contra Riesgos Sanitarios) es la autoridad que **regula y vigila** la seguridad sanitaria de alimentos, bebidas y otros productos en México.',
      'Los trámites y permisos dependen del tipo de negocio y de producto, así que conviene consultarlos directamente con la autoridad. La **PROFECO** vigila, entre otras cosas, la información comercial que recibe el consumidor.'
    ],
    cursos: ['normativ', 'regulacion', 'nom-051']
  },
  {
    id: 'limpieza', tema: 'Limpieza y desinfección',
    claves: ['limpieza', 'desinfeccion', 'sanitizar', 'sanitizante', 'desinfectante', 'cip', 'lavado de manos', 'higiene'],
    ejemplos: ['¿Cuál es la diferencia entre limpiar y desinfectar?', '¿Cómo limpio una planta de alimentos?', '¿Qué es sanitizar?', '¿Qué es un programa de limpieza y desinfección?', '¿Cómo me lavo bien las manos al manipular alimentos?', '¿Qué es el CIP?'],
    respuesta: [
      '**Limpiar** elimina la suciedad y los residuos visibles; **desinfectar** reduce los microorganismos a un nivel seguro. Son dos pasos distintos y **ambos** son necesarios: un desinfectante no funciona bien sobre una superficie sucia.',
      'Un programa de limpieza y desinfección define qué se limpia, con qué producto, cómo, con qué frecuencia y cómo se verifica. El **CIP** (clean in place) es la limpieza de equipos sin desarmarlos.'
    ],
    cursos: ['higiene', 'bpm', 'inocuidad']
  },
  {
    id: 'plagas', tema: 'Control de plagas',
    claves: ['plagas', 'control de plagas', 'roedores', 'cucarachas', 'insectos', 'fumigacion', 'manejo integrado de plagas'],
    ejemplos: ['¿Cómo se controlan las plagas en una planta de alimentos?', '¿Qué es el manejo integrado de plagas?', '¿Cómo evito roedores en mi bodega?', '¿Qué plagas afectan los alimentos?', '¿Cada cuánto se fumiga una planta?'],
    respuesta: [
      'El control de plagas en alimentos se basa en la **prevención**: impedir que entren (cierres, mallas, orden y limpieza), **monitorear** con trampas y registros, y actuar solo cuando hace falta, con productos aprobados y sin tocar los alimentos.',
      'Se conoce como **manejo integrado de plagas** y forma parte de las BPM. La frecuencia y los métodos dependen del tipo de instalación y del riesgo.'
    ],
    cursos: ['plagas', 'pesticidas', 'bpm']
  },
  {
    id: 'plaguicidas', tema: 'Residuos de plaguicidas',
    claves: ['plaguicidas', 'plaguicida', 'pesticidas', 'pesticida', 'residuos de plaguicidas', 'limite maximo de residuos', 'lmr', 'agroquimicos'],
    ejemplos: ['¿Qué son los residuos de plaguicidas?', '¿Qué es el límite máximo de residuos?', '¿Cómo se regulan los pesticidas en alimentos?', '¿Los plaguicidas son peligrosos en los alimentos?', '¿Cómo reduzco plaguicidas en mi producción?'],
    respuesta: [
      'Los **residuos de plaguicidas** son restos de los productos usados para proteger cultivos que pueden quedar en el alimento. Su presencia está regulada con **límites máximos de residuos (LMR)**, que dependen del plaguicida y del cultivo.',
      'La regulación y los controles buscan que lo que llega al consumidor esté dentro de lo permitido.'
    ],
    cursos: ['pesticidas', 'plagas', 'regulacion']
  },
  {
    id: 'alergenos', tema: 'Alérgenos',
    claves: ['libre de gluten', 'sin gluten', 'alergeno', 'alergenos', 'alergia', 'alergias', 'celiaquia', 'gluten', 'contacto cruzado'],
    ejemplos: ['¿Qué son los alérgenos?', '¿Cómo se controlan los alérgenos en una planta?', '¿Qué es el contacto cruzado de alérgenos?', '¿Los alérgenos van en la etiqueta?', '¿Qué es la celiaquía?', '¿Qué alimentos causan alergias?', '¿Qué es un producto libre de gluten?'],
    respuesta: [
      'Los **alérgenos** son sustancias (casi siempre proteínas) de ciertos alimentos que provocan **reacciones alérgicas** en algunas personas. Pueden ser graves.',
      'Se controlan separando las líneas y utensilios, limpiando bien entre productos y **declarándolos en la etiqueta**. El contacto cruzado ocurre cuando un alérgeno pasa sin querer a un producto que no lo lleva.'
    ],
    cursos: ['etiquetado', 'inocuidad', 'gestion']
  },
  {
    id: 'aditivos', tema: 'Aditivos alimentarios',
    claves: ['aditivo', 'aditivos', 'conservadores', 'colorantes', 'edulcorantes', 'saborizantes', 'ingredientes alimentarios'],
    ejemplos: ['¿Qué son los aditivos alimentarios?', '¿Para qué sirven los conservadores?', '¿Los aditivos son seguros?', '¿Qué son los edulcorantes?', '¿Qué aditivos se pueden usar?', '¿Qué es un colorante alimentario?'],
    respuesta: [
      'Un **aditivo alimentario** es una sustancia que se agrega a propósito a un alimento con una función tecnológica: conservarlo, darle color, sabor, textura o dulzor, entre otras.',
      'Están **regulados**: solo se permiten ciertos aditivos, en ciertos alimentos y en cantidades máximas, y deben declararse en la etiqueta.'
    ],
    cursos: ['aditivos', 'ingredientes', 'seguridad en el manejo']
  },
  {
    id: 'zona-peligro', tema: 'Temperaturas y zona de peligro',
    claves: ['temperatura se multiplican', 'multiplican las bacterias', 'temperatura mata', 'mata las bacterias', 'a que temperatura', 'zona de peligro', 'temperatura de peligro', 'temperaturas seguras', 'cocer', 'coccion', 'refrigeracion', 'refrigerar', 'congelacion', 'congelar', 'descongelar', 'temperatura de conservacion'],
    ejemplos: ['¿Qué es la zona de peligro de temperatura?', '¿A qué temperatura se multiplican las bacterias?', '¿Cómo descongelo un alimento de forma segura?', '¿Por qué importa la temperatura en los alimentos?', '¿A qué temperatura se debe refrigerar?', '¿Qué temperatura mata las bacterias?'],
    respuesta: [
      'La **zona de peligro** es el intervalo de temperatura en el que las bacterias se multiplican más rápido: aproximadamente **entre 5 °C y 60 °C**. Por eso los alimentos perecederos no deben pasar mucho tiempo ahí.',
      'Se controla con refrigeración o congelación para conservar y con una cocción suficiente para eliminar microorganismos. Las temperaturas exactas dependen del alimento y de la norma aplicable.'
    ],
    cursos: ['conservacion', 'perecederos', 'microbio']
  },
  {
    id: 'cadena-frio', tema: 'Cadena de frío',
    claves: ['cadena de frio', 'cadena del frio', 'transporte refrigerado', 'refrigerado'],
    ejemplos: ['¿Qué es la cadena de frío?', '¿Por qué es importante la cadena de frío?', '¿Qué pasa si se rompe la cadena de frío?', '¿Cómo transporto alimentos refrigerados?'],
    respuesta: [
      'La **cadena de frío** es mantener la temperatura adecuada (refrigeración o congelación) de un alimento **en cada etapa**: producción, almacenamiento, transporte, venta y hogar.',
      'Si se rompe, los microorganismos pueden multiplicarse y el producto pierde inocuidad y calidad, aunque después vuelva a enfriarse.'
    ],
    cursos: ['conservacion', 'perecederos', 'vida util']
  },
  {
    id: 'conservacion', tema: 'Conservación de alimentos',
    claves: ['conservacion de alimentos', 'conservar alimentos', 'pasteurizacion', 'pasteurizar', 'esterilizacion', 'deshidratacion', 'envasado al vacio', 'conservacion', 'perecederos'],
    ejemplos: ['¿Cómo se conservan los alimentos?', '¿Qué es la pasteurización?', '¿Qué métodos de conservación existen?', '¿Cómo alargo la vida de un alimento perecedero?', '¿Qué es la esterilización de alimentos?', '¿Para qué sirve deshidratar alimentos?'],
    respuesta: [
      'Conservar es **frenar o detener** lo que echa a perder un alimento. Los métodos más comunes son: frío (refrigeración y congelación), calor (como la **pasteurización**, que reduce los microorganismos sin esterilizar, y la esterilización), secado o deshidratación, envasado (por ejemplo al vacío o con atmósfera modificada) y conservadores.',
      'Muchas veces se combinan varios métodos. El adecuado depende del tipo de alimento y de la vida útil que se busca.'
    ],
    cursos: ['conservacion', 'perecederos', 'microbiologico']
  },
  {
    id: 'fermentacion', tema: 'Fermentación y biotecnología de alimentos',
    claves: ['fermentacion', 'fermentados', 'fermentar', 'biotecnologia', 'probioticos', 'probiotico', 'levadura', 'yogur', 'cerveza'],
    ejemplos: ['¿Qué es la fermentación?', '¿Cómo funciona la fermentación en alimentos?', '¿Qué son los probióticos?', '¿Qué alimentos son fermentados?', '¿Qué es la biotecnología de alimentos?', '¿Cómo se hace la cerveza?'],
    respuesta: [
      'La **fermentación** es un proceso en el que microorganismos (levaduras, bacterias) transforman componentes del alimento: así se elaboran el yogur, el queso, el pan, la cerveza, el vino o el chocolate, entre otros.',
      'La **biotecnología de alimentos** aprovecha estos procesos (y otros biológicos) para obtener productos, mejorar su calidad o desarrollar ingredientes funcionales, como los probióticos.'
    ],
    cursos: ['fermentacion', 'biotecnologia', 'bebidas']
  },
  {
    id: 'bioprocesos', tema: 'Bioprocesos y biorreactores',
    claves: ['bioprocesos', 'bioproceso', 'biorreactor', 'biorreactores', 'escalado', 'escalamiento', 'ingenieria de bioprocesos'],
    ejemplos: ['¿Qué es un biorreactor?', '¿Qué es un bioproceso?', '¿Qué es el escalado de procesos?', '¿Para qué sirven los biorreactores en alimentos?', '¿Qué es la ingeniería de bioprocesos?'],
    respuesta: [
      'Un **biorreactor** es un equipo donde se cultivan microorganismos o células en condiciones controladas (temperatura, pH, oxígeno, agitación) para producir algo útil: un alimento fermentado, una enzima o un ingrediente.',
      'La **ingeniería de bioprocesos** diseña y optimiza esos procesos, y el **escalado** consiste en pasar de una prueba pequeña de laboratorio a una producción industrial.'
    ],
    cursos: ['biorreactor', 'bioproceso', 'fermentacion']
  },
  {
    id: 'funcionales', tema: 'Alimentos funcionales y nutracéuticos',
    claves: ['alimentos funcionales', 'funcional', 'funcionales', 'nutraceutico', 'nutraceuticos', 'suplementos alimenticios', 'suplementos', 'bebidas energeticas'],
    ejemplos: ['¿Qué son los alimentos funcionales?', '¿Qué es un nutracéutico?', '¿Qué diferencia hay entre un suplemento y un alimento funcional?', '¿Qué son las bebidas energéticas?', '¿Cómo se desarrolla un producto funcional?'],
    respuesta: [
      'Un **alimento funcional** aporta, además de nutrición, un posible **beneficio para la salud** por alguno de sus componentes (por ejemplo, fibra o probióticos). Los **nutracéuticos** son compuestos o productos con efectos fisiológicos beneficiosos, a veces presentados como suplementos.',
      'En México estos productos deben cumplir la regulación sanitaria y de etiquetado, y las **declaraciones de beneficios** que se hagan en la etiqueta están controladas.'
    ],
    cursos: ['funcional', 'nutraceutic', 'formulacion']
  },
  {
    id: 'nano', tema: 'Nanotecnología y envases inteligentes',
    claves: ['nanotecnologia', 'nanomateriales', 'nano', 'envases inteligentes', 'empaque inteligente', 'empaques', 'envases activos'],
    ejemplos: ['¿Qué es la nanotecnología en alimentos?', '¿Qué son los envases inteligentes?', '¿Qué es un empaque activo?', '¿Para qué sirven los nanomateriales en alimentos?', '¿Qué innovaciones hay en empaques de alimentos?'],
    respuesta: [
      'La **nanotecnología** trabaja con materiales a escala nanométrica (una milmillonésima de metro). En alimentos se estudia para mejorar empaques, proteger el producto, detectar contaminantes o liberar ingredientes de forma controlada.',
      'Los **envases inteligentes** pueden avisar de cambios en el producto (temperatura, frescura) y los **activos** ayudan a conservarlo mejor. Su uso está sujeto a evaluación de seguridad y regulación.'
    ],
    cursos: ['nanotecnologia', 'envases', 'nanomateriales']
  },
  {
    id: 'recubrimientos', tema: 'Recubrimientos comestibles',
    claves: ['recubrimientos comestibles', 'recubrimiento comestible', 'peliculas comestibles', 'coating'],
    ejemplos: ['¿Qué son los recubrimientos comestibles?', '¿Para qué sirven los recubrimientos en frutas?', '¿Cómo alargar la vida de frutas y verduras?', '¿De qué están hechos los recubrimientos comestibles?'],
    respuesta: [
      'Los **recubrimientos comestibles** son capas muy delgadas de materiales que se pueden comer (como polisacáridos, proteínas o lípidos) que se aplican sobre el alimento.',
      'Ayudan a **alargar su vida útil**: reducen la pérdida de agua, frenan el deterioro y pueden proteger de microorganismos.'
    ],
    cursos: ['recubrimientos', 'conservacion', 'vida util']
  },
  {
    id: 'muestreo', tema: 'Muestreo y análisis',
    claves: ['tomar una muestra', 'toma una muestra', 'tomar muestras', 'muestreo','toma de muestras', 'muestra representativa', 'analisis de laboratorio', 'analisis fisicoquimico', 'fisicoquimico', 'laboratorio'],
    ejemplos: ['¿Qué es el muestreo?', '¿Cómo se toma una muestra de alimento?', '¿Qué es una muestra representativa?', '¿Qué análisis se hacen a los alimentos?', '¿Para qué sirve el laboratorio en una planta de alimentos?'],
    respuesta: [
      'El **muestreo** es tomar una parte del producto que **represente al lote completo** para analizarla. Si la muestra está mal tomada, el resultado del análisis no sirve, por bueno que sea el laboratorio.',
      'Se hacen análisis **microbiológicos**, **fisicoquímicos** (como humedad, pH o grasa) y **sensoriales**, según lo que se quiera comprobar.'
    ],
    cursos: ['muestreo', 'microbio', 'validacion']
  },
  {
    id: 'agua', tema: 'Calidad del agua en alimentos',
    claves: ['agua potable', 'calidad del agua', 'agua en alimentos', 'microbiologia del agua', 'salubridad'],
    ejemplos: ['¿Por qué importa el agua en una planta de alimentos?', '¿Cómo se controla la calidad del agua?', '¿Qué es la microbiología del agua?', '¿El agua puede contaminar los alimentos?'],
    respuesta: [
      'El agua se usa como ingrediente, para lavar, enfriar y limpiar; por eso, si no es de buena calidad, puede **contaminar el alimento**. Debe cumplir los criterios de agua potable y verificarse con análisis.',
      'Se controla con tratamiento (como la cloración), monitoreo de parámetros y análisis microbiológicos periódicos.'
    ],
    cursos: ['agua', 'microbio', 'salubridad']
  },
  {
    id: 'quimicos', tema: 'Manejo seguro de sustancias químicas',
    claves: ['sustancias quimicas', 'productos quimicos', 'hoja de seguridad', 'hojas de seguridad', 'sds', 'quimicos', 'reactivos'],
    ejemplos: ['¿Cómo se manejan las sustancias químicas de forma segura?', '¿Qué es una hoja de seguridad?', '¿Cómo almaceno productos químicos de limpieza?', '¿Qué riesgos tienen los químicos en una planta de alimentos?', '¿Cómo identifico una sustancia peligrosa?'],
    respuesta: [
      'El manejo seguro de sustancias químicas protege a las **personas** y al **alimento**. Incluye identificarlas con etiquetas claras, consultar su **hoja de datos de seguridad**, almacenarlas aparte de los alimentos y usar el equipo de protección adecuado.',
      'En plantas de alimentos se aplica a limpiadores, desinfectantes, lubricantes y reactivos de laboratorio.'
    ],
    cursos: ['sustancias quimicas', 'seguridad', 'manejo seguro']
  }
];
