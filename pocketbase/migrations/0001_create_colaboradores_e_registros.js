migrate(
  (app) => {
    const colaboradores = new Collection({
      name: 'colaboradores',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'nome', type: 'text', required: true },
        { name: 'funcao', type: 'text', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_colaboradores_nome ON colaboradores (nome)'],
    })
    app.save(colaboradores)

    const colaboradoresCol = app.findCollectionByNameOrId('colaboradores')

    const registros = new Collection({
      name: 'registros_horas',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'colaborador',
          type: 'relation',
          required: true,
          collectionId: colaboradoresCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'data', type: 'text', required: true },
        { name: 'hora', type: 'text', required: true },
        { name: 'quantidade_horas', type: 'number', required: true, min: 0.1 },
        { name: 'valor_hora', type: 'number', required: true, min: 0.01 },
        {
          name: 'percentual',
          type: 'select',
          required: true,
          values: ['50%', '100%'],
          maxSelect: 1,
        },
        { name: 'valor_total', type: 'number', required: false, min: 0 },
        { name: 'observacao', type: 'text', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_registros_colaborador ON registros_horas (colaborador)',
        'CREATE INDEX idx_registros_data ON registros_horas (data)',
      ],
    })
    app.save(registros)
  },
  (app) => {
    try {
      const registros = app.findCollectionByNameOrId('registros_horas')
      app.delete(registros)
    } catch (_) {}

    try {
      const colaboradores = app.findCollectionByNameOrId('colaboradores')
      app.delete(colaboradores)
    } catch (_) {}
  },
)
