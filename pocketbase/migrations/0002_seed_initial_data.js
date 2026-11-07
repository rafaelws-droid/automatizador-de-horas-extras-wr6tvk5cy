migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    // Seed default admin user if not exists
    let adminUserId = ''
    try {
      const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'rafaelws@silveiratransportes.com')
      adminUserId = admin.id
    } catch (_) {
      const record = new Record(users)
      record.setEmail('rafaelws@silveiratransportes.com')
      record.setPassword('Skip@Pass')
      record.setVerified(true)
      record.set('name', 'Gestor de RH')
      app.save(record)
      adminUserId = record.id
    }

    // Also seed standard admin demo credentials if desired (admin@empresa.com)
    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'admin@empresa.com')
    } catch (_) {
      const demoAdmin = new Record(users)
      demoAdmin.setEmail('admin@empresa.com')
      demoAdmin.setPassword('Skip@Pass')
      demoAdmin.setVerified(true)
      demoAdmin.set('name', 'Gestor RH - Demo')
      app.save(demoAdmin)
    }

    // Seed initial colaboradores
    const colabCol = app.findCollectionByNameOrId('colaboradores')
    const registrosCol = app.findCollectionByNameOrId('registros_horas')

    const colaboradoresData = [
      { nome: 'Carlos Eduardo Silva', funcao: 'Motorista Carreteiro' },
      { nome: 'Mariana Ferreira Souza', funcao: 'Operadora de Logística' },
      { nome: 'Roberto Almeida Lima', funcao: 'Assistente de Expedição' },
      { nome: 'Juliana Mendes Rocha', funcao: 'Supervisora de Operações' },
      { nome: 'Lucas Gabriel Santos', funcao: 'Mecânico de Manutenção' },
    ]

    const createdColabs = []
    for (const c of colaboradoresData) {
      try {
        const existing = app.findFirstRecordByData('colaboradores', 'nome', c.nome)
        createdColabs.push(existing)
      } catch (_) {
        const rec = new Record(colabCol)
        rec.set('nome', c.nome)
        rec.set('funcao', c.funcao)
        app.save(rec)
        createdColabs.push(rec)
      }
    }

    // Seed initial sample registros if table is empty
    const count = app.countRecords('registros_horas')
    if (count === 0 && createdColabs.length >= 3) {
      const today = new Date()
      const formatDate = (daysAgo) => {
        const d = new Date(today)
        d.setDate(d.getDate() - daysAgo)
        return d.toISOString().split('T')[0]
      }

      const initialRegistros = [
        {
          colaborador: createdColabs[0].id,
          data: formatDate(3),
          hora: '18:30',
          quantidade_horas: 2.5,
          valor_hora: 28.5,
          percentual: '50%',
          valor_total: 2.5 * 28.5 * 1.5, // 106.875 -> 106.88
          observacao: 'Atraso na liberação de carga e descarga',
        },
        {
          colaborador: createdColabs[1].id,
          data: formatDate(2),
          hora: '19:00',
          quantidade_horas: 3,
          valor_hora: 22.0,
          percentual: '50%',
          valor_total: 3 * 22.0 * 1.5, // 99.00
          observacao: 'Conferência de inventário semanal',
        },
        {
          colaborador: createdColabs[2].id,
          data: formatDate(1),
          hora: '14:00',
          quantidade_horas: 4,
          valor_hora: 20.0,
          percentual: '100%',
          valor_total: 4 * 20.0 * 2.0, // 160.00
          observacao: 'Plantão de expedição no domingo',
        },
        {
          colaborador: createdColabs[3].id,
          data: formatDate(0),
          hora: '17:45',
          quantidade_horas: 1.5,
          valor_hora: 35.0,
          percentual: '50%',
          valor_total: 1.5 * 35.0 * 1.5, // 78.75
          observacao: 'Fechamento de escala emergencial',
        },
      ]

      for (const reg of initialRegistros) {
        const rec = new Record(registrosCol)
        rec.set('colaborador', reg.colaborador)
        rec.set('data', reg.data)
        rec.set('hora', reg.hora)
        rec.set('quantidade_horas', reg.quantidade_horas)
        rec.set('valor_hora', reg.valor_hora)
        rec.set('percentual', reg.percentual)
        rec.set('valor_total', Math.round(reg.valor_total * 100) / 100)
        rec.set('observacao', reg.observacao)
        app.save(rec)
      }
    }
  },
  (app) => {
    // down migration
  },
)
