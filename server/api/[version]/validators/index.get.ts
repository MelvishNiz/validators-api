import type { Validator } from 'nimiq-rpc-client-ts'
import { getRpcClient } from '~~/server/lib/client'
import { mainQuerySchema } from '~~/server/utils/schemas'
import { fetchValidators } from '~~/server/utils/validators'

export default defineCachedEventHandler(async (event) => {
  const params = await getValidatedQuery(event, mainQuerySchema.parse)

  let addresses: string[] = []
  let activeValidators: Validator[] = []
  if (params.onlyActive) {
    const { data: _activeValidators, error: errorActiveValidators } = await getRpcClient().blockchain.getActiveValidators()
    if (errorActiveValidators)
      return createError(errorActiveValidators)
    activeValidators = _activeValidators
    addresses = activeValidators.map(v => v.address)
  }

  const { data: validators, error: errorValidators } = await fetchValidators({ ...params, addresses })
  if (errorValidators || !validators)
    throw createError(errorValidators)

  // for (const validator of validators) {
  //   // @ts-expect-error this is a hack to add the balance to the validator object
  //   // A better solution would be to add a balance field to the Validator type
  //   // and update the fetchValidators function to include the balance
  //   validator.balance = activeValidators.find(v => v.address === validator.address)?.balance
  // }

  return validators
}, {
  maxAge: import.meta.dev ? 1 : 60 * 10, // 10 minutes
})
