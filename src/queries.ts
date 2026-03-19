export const GET_AXIE = `
  query GetAxie($axieId: ID!) {
    axie(axieId: $axieId) {
      id
      name
      owner
      class
      bodyShape
      stage
      newGenes
      birthDate
      breedCount
      numMystic
      numJapan
      numXmas
      pureness
      purity
      chain
      image
      minPrice
      status
      stats { hp speed skill morale }
      parts {
        id
        type
        class
        name
        specialGenes
        stage
        abilities { id name description attackType attack defense energy }
      }
      fortuneSlips { total potentialAmount collectibles { name base evolved } }
      equipment { tokenId name description imageUrl }
      equipmentInstances { tokenId alias equipmentType slot name rarity collections }
      axpInfo { level onchainLevel xp xpToLevelUp shouldAscend }
      battleInfo { banned banUntil level }
      potentialPoints { beast aquatic plant bug bird reptile mech dawn dusk }
      order {
        id
        maker
        currentPrice
        currentPriceUsd
        basePrice
        endedPrice
        paymentToken
        status
        kind
        expiredAt
        startedAt
        suggestedPrice
      }
    }
  }
`;

export const SEARCH_AXIES = `
  query SearchAxies(
    $auctionType: AuctionType
    $criteria: AxieSearchCriteria
    $owner: String
    $from: Int
    $size: Int
    $sort: SortBy
  ) {
    axies(
      auctionType: $auctionType
      criteria: $criteria
      owner: $owner
      from: $from
      size: $size
      sort: $sort
    ) {
      total
      results {
        id
        name
        owner
        class
        bodyShape
        stage
        breedCount
        numMystic
        numJapan
        numXmas
        pureness
        purity
        image
        minPrice
        status
        stats { hp speed skill morale }
        parts { id type class name specialGenes stage }
        axpInfo { level xp }
        order {
          id
          currentPrice
          currentPriceUsd
          paymentToken
          status
          kind
        }
      }
    }
  }
`;

export const GET_EXCHANGE_RATE = `
  query GetExchangeRate {
    exchangeRate {
      eth { usd }
      axs { usd }
      slp { usd }
      ron { usd }
      usdc { usd }
    }
  }
`;

export const GET_MARKET_STATS = `
  query GetMarketStats {
    marketStats {
      last24Hours { count axieCount volume volumeUsd }
      last7Days { count axieCount volume volumeUsd }
      last30Days { count axieCount volume volumeUsd }
    }
  }
`;

export const GET_OVERALL_MARKET_STATS = `
  query GetOverallMarketStats {
    overallMarketStats {
      newAxies { last24H last7D last30D allTime }
      mkpVolume { last24H last7D last30D allTime }
      mkpTxs { last24H last7D last30D allTime }
      mkpVolumeInUsdAllTime
      ascendedAxiesLast7D
    }
  }
`;

export const GET_AXIE_TRANSFER_HISTORY = `
  query GetAxieTransferHistory($axieId: ID!, $from: Int, $size: Int) {
    axie(axieId: $axieId) {
      id
      name
      transferHistory(from: $from, size: $size) {
        total
        results {
          tokenId
          from
          to
          timestamp
          txHash
          withPrice
          withPriceUsd
          settleQuantity
          logIndex
        }
      }
    }
  }
`;

export const GET_PUBLIC_PROFILE = `
  query GetPublicProfile($id: UUID!) {
    publicProfile(id: $id) {
      accountId
      addresses { ethereum ronin }
      name
    }
  }
`;

export const GET_PUBLIC_PROFILE_BY_ADDRESS = `
  query GetPublicProfileByAddress($roninAddress: String) {
    publicProfileWithRoninAddress(roninAddress: $roninAddress) {
      accountId
      addresses { ethereum ronin }
      name
    }
  }
`;

export const GET_LANDS = `
  query GetLands(
    $auctionType: AuctionType
    $criteria: LandSearchCriteria
    $owner: Owner
    $from: Int
    $size: Int
    $sort: SortBy
  ) {
    lands(
      auctionType: $auctionType
      criteria: $criteria
      owner: $owner
      from: $from
      size: $size
      sort: $sort
    ) {
      total
      results {
        tokenId
        owner
        col
        row
        landType
        minPrice
        order {
          id
          currentPrice
          currentPriceUsd
          paymentToken
          status
        }
      }
    }
  }
`;

export const GET_LAND = `
  query GetLand($col: Int!, $row: Int!) {
    land(col: $col, row: $row) {
      tokenId
      owner
      col
      row
      landType
      minPrice
      order {
        id
        currentPrice
        currentPriceUsd
        paymentToken
        status
      }
    }
  }
`;

export const GET_TOP_SALES = `
  query GetTopSales($tokenType: TokenType!, $periodType: PeriodType!, $size: Int!) {
    topSales(tokenType: $tokenType, periodType: $periodType, size: $size) {
      results {
        orderId
        settlePrice
        settlePriceUsd
        timestamp
        settleQuantity
        asset {
          erc
          address
          id
          quantity
          token {
            ... on Axie {
              id
              name
              class
              image
            }
            ... on LandPlot {
              tokenId
              landType
              col
              row
            }
          }
        }
      }
    }
  }
`;

export const GET_LEADERBOARD = `
  query GetLeaderboard($type: LeaderboardType!, $from: Int!, $size: Int!) {
    leaderboard(type: $type, from: $from, size: $size) {
      totalParticipants
      totalScore
      ranks {
        user
        rank
        score
        userProfile {
          accountId
          name
          addresses { ronin }
        }
      }
    }
  }
`;

export const GET_ERC1155_TOKENS = `
  query GetErc1155Tokens($owner: String, $tokenType: Erc1155Type!, $from: Int, $size: Int) {
    erc1155Tokens(owner: $owner, tokenType: $tokenType, from: $from, size: $size) {
      total
      results {
        tokenId
        tokenAddress
        total
        name
        description
        imageUrl
        minPrice
      }
    }
  }
`;

export const GET_AXIE_BREEDS = `
  query GetAxieBreeds($axieId: ID!) {
    axie(axieId: $axieId) {
      id
      name
      breedCount
      children {
        id
        name
        class
        stage
        image
        birthDate
        owner
        stats { hp speed skill morale }
        parts { id type class name }
      }
      matronId
      sireId
    }
  }
`;

export const GET_USER_ACTIVITIES = `
  query GetUserActivities($userAddress: String!, $activityTypes: [UserActivityType!], $size: Int) {
    userActivities(userAddress: $userAddress, activityTypes: $activityTypes, size: $size) {
      id
      activityType
      fromAddress
      toAddress
      createdAt
      txHash
      amount
    }
  }
`;

export const GET_AXIE_EQUIPMENT = `
  query GetAxieEquipment($axieIds: [Int!]!) {
    axiesEquipments(axieIds: $axieIds) {
      axieId
      equipments {
        tokenId
        alias
        equipmentType
        slot
        name
        rarity
        collections
      }
      accessories {
        tokenId
        name
        description
        imageUrl
      }
    }
  }
`;

export const GET_BADGES = `
  query GetBadges($ownerFilter: BadgeOwnerFilter) {
    badges(ownerFilter: $ownerFilter) {
      total
      results {
        id
        name
        baseName
        description
        category
        badgeType
        axieScore
        numHolders
        imageUrl
      }
    }
  }
`;
