/*
  Authorised-provider adapter layer.

  Replace these functions only after you have a legitimate provider's
  API documentation, merchant/client credentials, permitted use case,
  consent requirements and production endpoint.

  The server never accepts arbitrary provider URLs from the browser.
*/

async function notConfigured(service){
  return {
    ok:false,
    code:"PROVIDER_NOT_CONFIGURED",
    service,
    message:`${service} provider integration is not configured. Add an authorised provider before enabling this service.`
  };
}

async function panService(payload){ return notConfigured("PAN"); }
async function voterService(payload){ return notConfigured("Voter/e-EPIC"); }
async function aadhaarService(payload){ return notConfigured("Aadhaar"); }
async function digilockerService(payload){ return notConfigured("DigiLocker"); }

module.exports={panService,voterService,aadhaarService,digilockerService};
