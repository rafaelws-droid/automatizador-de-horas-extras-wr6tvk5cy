// 0005 — Empresa por colaborador, cadastro de equipamentos e novos campos no lançamento.
// Registros antigos ficam com local_trabalho/equipamento vazios e continuam sendo exibidos.

migrate(
  (app) => {
    // 1. Campo empresa (obrigatório para novos cadastros) na coleção colaboradores.
    const colaboradores = app.findCollectionByNameOrId('colaboradores')
    if (!colaboradores.fields.getByName('empresa')) {
      colaboradores.fields.add(
        new SelectField({
          name: 'empresa',
          values: ['RAFAEL', 'RUANN', 'OLIMAR'],
          maxSelect: 1,
          required: true,
          presentable: true,
        }),
      )
    }
    app.save(colaboradores)

    // 2. Nova coleção de equipamentos/veículos.
    if (!app.hasTable('equipamentos')) {
      const equipamentos = new Collection({
        name: 'equipamentos',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'identificacao', type: 'text', required: true, min: 1, max: 40 },
          { name: 'descricao', type: 'text', required: false, max: 120 },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_equipamentos_identificacao ON equipamentos (identificacao)',
        ],
      })
      app.save(equipamentos)
    }

    // 3. Novos campos em registros_horas: local_trabalho (texto livre controlado na UI por
    // select) e equipamento (relação com a coleção equipamentos) — vazios nos registros antigos.
    const registros = app.findCollectionByNameOrId('registros_horas')
    if (!registros.fields.getByName('local_trabalho')) {
      registros.fields.add(new TextField({ name: 'local_trabalho', required: false, max: 60 }))
    }
    if (!registros.fields.getByName('equipamento')) {
      registros.fields.add(
        new RelationField({
          name: 'equipamento',
          collectionId: app.findCollectionByNameOrId('equipamentos').id,
          maxSelect: 1,
          required: false,
        }),
      )
    }
    app.save(registros)
  },
  (app) => {
    const registros = app.findCollectionByNameOrId('registros_horas')
    const eqField = registros.fields.getByName('equipamento')
    if (eqField) registros.fields.removeByName('equipamento')
    const localField = registros.fields.getByName('local_trabalho')
    if (localField) registros.fields.removeByName('local_trabalho')
    app.save(registros)

    try {
      const equipamentos = app.findCollectionByNameOrId('equipamentos')
      app.delete(equipamentos)
    } catch (_) {}

    const colaboradores = app.findCollectionByNameOrId('colaboradores')
    const empField = colaboradores.fields.getByName('empresa')
    if (empField) colaboradores.fields.removeByName('empresa')
    app.save(colaboradores)
  },
)
