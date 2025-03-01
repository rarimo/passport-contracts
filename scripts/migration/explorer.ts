import { RegistrationData, Transaction } from "@/scripts/migration/types";

import { buildExplorerAPIURL } from "@/scripts/migration/constants";

export async function getRegistrationTransactionInfos(address: string): Promise<RegistrationData[]> {
  return new Promise<RegistrationData[]>((resolve, reject) => {
    fetch(buildExplorerAPIURL(address))
      .then((res) => res.json())
      .then((data) => {
        const transactions: Transaction[] = data.result;

        const userTransactions: RegistrationData[] = transactions.map((transaction) => {
          return {
            data: transaction.input,
            blockNumber: Number(transaction.blockNumber),
          };
        });

        resolve(userTransactions.reverse());
      })
      .catch(reject);
  });
}
