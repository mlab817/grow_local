import { RepositoryContainer } from '../../repositories/ports';
import { CustomerShopStatusDTO } from '@growlocal/shared';

export class CustomerDomainService {
  constructor(private repos: RepositoryContainer) {}

  async getCustomerShops(clientId: string): Promise<CustomerShopStatusDTO[]> {
    return this.repos.visits.listCustomerShops(clientId);
  }

}
