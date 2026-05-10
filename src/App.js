import React, { useState } from "react";
import axios from "axios";

function App() {
  const [rules, setRules] = useState([]);

  const loginToSalesforce = () => {
    window.open(
      "http://localhost:5000/login",
      "_self"
    );
  };

  const fetchValidationRules =
    async () => {
      try {
        const response =
          await axios.get(
            "http://localhost:5000/validation-rules",
            {
              withCredentials: true,
            }
          );

        setRules(response.data);
      } catch (error) {
        console.log(error);
      }
    };

    const toggleRule = async (id) => {
  try {
    await axios.get(
      `http://localhost:5000/toggle-rule/${id}`,
      {
        withCredentials: true,
      }
    );

    alert("Toggle request sent");

    fetchValidationRules();
  } catch (error) {
    console.log(error);

    alert("Toggle failed");
  }
};

  return (
    <div
      style={{
        padding: "30px",
        fontFamily: "Arial",
      }}
    >
      <h1>
        Salesforce Validation Rule Manager
      </h1>

      <button
        onClick={loginToSalesforce}
      >
        Login to Salesforce
      </button>

      <br />
      <br />

      <button
        onClick={
          fetchValidationRules
        }
      >
        Get Validation Rules
      </button>

      <br />
      <br />

      {rules.map((rule) => (
        <div
          key={rule.Id}
          style={{
            border:
              "1px solid gray",
            padding: "10px",
            marginBottom: "10px",
          }}
        >
          <h3>
            {rule.ValidationName}
          </h3>

          <p>
            Status:
            {rule.Active
              ? " Active"
              : " Inactive"}
          </p>

<button
  onClick={() =>
    toggleRule(rule.Id)
  }
>
  Toggle Rule
</button>
        </div>
      ))}
    </div>
  );
}

export default App;