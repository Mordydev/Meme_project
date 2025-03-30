import { EventBus, eventBus } from '../../lib/event-bus';
import { MarketService } from './market-service';
import { PriceProvider } from './providers/price-provider';
import { TransactionProvider } from './providers/transaction-provider';
import { MilestoneTracker } from './milestone-tracker';
import { marketRepository, MarketRepository } from './repository/market-repository';

// Instantiate dependencies (or import singletons)
// const priceProvider = new PriceProvider();
// const transactionProvider = new TransactionProvider();
// const milestoneTracker = new MilestoneTracker(/* marketRepository */); // Pass repo if needed

// Instantiate the MarketService with its dependencies
// export const marketService = new MarketService(
//     eventBus,
//     priceProvider,
//     transactionProvider,
//     milestoneTracker,
//     marketRepository
// );

// Placeholder export until dependencies are fully implemented/injected
export const marketService = new MarketService(eventBus); 

// Optionally export other components if needed elsewhere
export { MarketService, PriceProvider, TransactionProvider, MilestoneTracker, MarketRepository };
