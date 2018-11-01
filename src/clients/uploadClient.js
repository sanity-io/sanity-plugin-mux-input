import {Observable} from 'rxjs'
import client from 'part:@sanity/base/client'
import getIt from 'get-it'
import base from 'get-it/lib/middleware/base'
import observable from 'get-it/lib/middleware/observable'
import jsonResponse from 'get-it/lib/middleware/jsonResponse'
import {progress} from 'get-it/lib/middleware'

const baseUrl = client.clientConfig.url

const request = getIt([base(baseUrl), progress(), jsonResponse()])

request.use(observable({implementation: Observable}))

export default {
  request,
  clientConfig: {...client.clientConfig, url: baseUrl}
}
