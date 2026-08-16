const tripsEndpoint = 'http://localhost:3000/api/trips';
const pageSize = 9;

const buildPageUrl = (page) => {
    const parameters = new URLSearchParams({
        sortField: 'name',
        sortDirection: 'asc',
        page: String(page),
        pageSize: String(pageSize)
    });

    return `${tripsEndpoint}?${parameters.toString()}`;
};

const readTripPage = async (fetchImpl, page) => {
    const response = await fetchImpl(buildPageUrl(page), {
        method: 'GET',
        headers: { Accept: 'application/json' }
    });

    if (!response.ok) {
        throw new Error(`Trip API request failed with status ${response.status}.`);
    }

    const result = await response.json();
    if (
        !result ||
        !Array.isArray(result.items) ||
        !Number.isInteger(result.totalPages)
    ) {
        throw new Error('Trip API returned an invalid catalog response.');
    }

    return result;
};

const fetchAllTrips = async (fetchImpl = fetch) => {
    const firstPage = await readTripPage(fetchImpl, 1);
    if (firstPage.totalPages <= 1) {
        return firstPage.items;
    }

    const remainingRequests = [];
    for (let page = 2; page <= firstPage.totalPages; page += 1) {
        remainingRequests.push(readTripPage(fetchImpl, page));
    }

    const remainingPages = await Promise.all(remainingRequests);
    return [
        ...firstPage.items,
        ...remainingPages.flatMap((result) => result.items)
    ];
};

const travel = async (_req, res) => {
    try {
        const trips = await fetchAllTrips();
        const message = trips.length === 0
            ? 'No trips exist in our database!'
            : null;

        return res.render('travel', {
            title: 'Travlr Getaways',
            trips,
            message
        });
    } catch (error) {
        return res.status(500).send(error.message);
    }
};

module.exports = {
    buildPageUrl,
    fetchAllTrips,
    travel
};
