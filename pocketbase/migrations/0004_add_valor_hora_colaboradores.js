// Adiciona o campo "valor_hora" (valor da hora pré-definido, em R$) à coleção "colaboradores".
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('colaboradores')
    if (!col.fields.getByName('valor_hora')) {
      col.fields.add(new NumberField({ name: 'valor_hora', min: 0 }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('colaboradores')
    const field = col.fields.getByName('valor_hora')
    if (field) {
      col.fields.removeByName('valor_hora')
    }
    app.save(col)
  },
)
