import { DataSourceInstanceSettings, DataFrame } from '@grafana/data';
import { DataSourceWithBackend, getTemplateSrv } from '@grafana/runtime';
import { MyDataSourceOptions, SQLiteQuery } from './types';

export class DataSource extends DataSourceWithBackend<SQLiteQuery, MyDataSourceOptions> {
  templateSrv;

  constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);

    this.templateSrv = getTemplateSrv();
  }

  applyTemplateVariables(query: SQLiteQuery): SQLiteQuery {
    query.queryText = this.templateSrv.replace(query.rawQueryText);
    return query;
  }

  async metricFindQuery(query: string, options?: any) {
    if (!query || !options.variable.datasource) {
      return Promise.resolve([]);
    }
    const response = await this.query({
      targets: [
        {
          rawQueryText: query,
          queryText: query,
          timeColumns: [],
        },
      ],
    } as any).toPromise();

    if (response.error) {
      throw new Error(response.error.message);
    }

    const data = response.data[0] as DataFrame;

    if (data.fields.length !== 1) {
      throw new Error(
        `Received more than one (${data.fields.length}) fields: ${data.fields.map(x => x.name).join(',')}`
      );
    }

    return data.fields[0].values.toArray().map(text => ({ text }));
  }
}
