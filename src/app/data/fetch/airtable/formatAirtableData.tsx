export default function formatAirtableData(data: { records: any[] }) {
  return data.records.map((record) => {
    const {
      airtable_created_time,
      import_created_time,
      created_time,
      ...otherFields
    } = record.fields;

    return {
      id: record.id,
      created: new Date(created_time).getTime(),
      conditional: {
        isToken: true,
        isWalletGated: true,
      },
      fields: {
        ...otherFields,
      },
    };
  });
}
