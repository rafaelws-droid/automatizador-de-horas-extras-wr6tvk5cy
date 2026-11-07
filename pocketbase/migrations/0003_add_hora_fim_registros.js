migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('registros_horas')
    if (!col.fields.getByName('hora_fim')) {
      col.fields.add(new TextField({ name: 'hora_fim', required: false }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('registros_horas')
    if (col.fields.getByName('hora_fim')) {
      col.fields.removeByName('hora_fim')
      app.save(col)
    }
  },
)
