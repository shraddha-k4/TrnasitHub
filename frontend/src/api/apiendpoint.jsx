export const baseUrl = "http://localhost:3000";

//routes of train
export const createtrain = `${baseUrl}/api/trains/createtrain`; //multiples train can add
export const gettrain = `${baseUrl}/api/trains/gettrain`;
export const pushtrain = `${baseUrl}/api/trains/pushtrain`;//one train can add
export const updatetrain = `${baseUrl}/api/trains/:train_number`;


