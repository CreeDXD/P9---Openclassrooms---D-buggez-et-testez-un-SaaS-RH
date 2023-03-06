/**
 * @jest-environment jsdom
 */

import NewBillUI from "../views/NewBillUI.js" 
import NewBill from "../containers/NewBill.js" 

import { bills } from "../fixtures/bills.js"
import BillsUI from "../views/BillsUI.js"

import {screen,waitFor, fireEvent} 
from "@testing-library/dom";
import '@testing-library/jest-dom/extend-expect'
import { ROUTES,ROUTES_PATH} from "../constants/routes.js"  
import {localStorageMock} from "../__mocks__/localStorage.js" 
import userEvent from "@testing-library/user-event"; 
import { setSessionStorage } from "../../setup-jest";
import Store from "../app/Store";
import store from "../__mocks__/store";
import mockStore from '../__mocks__/store';
import router from "../app/Router.js";

// jest.mock('../app/Store', () => ({
//   default: () => mockStore
// }));

// const onNavigate = (pathname) => {
//   document.body.innerHTML = ROUTES({ pathname });
// };

const data = {
  id: "47qAXb6fIm2zOKkLzMro",
  vat: "80",
  fileUrl:
    "hhttps://test.storage.tld/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
  status: "pending",
  type: "Hôtel et logement",
  commentary: "séminaire billed",
  name: "encore",
  fileName: "preview-facture-free-201801-pdf-1.jpg",
  date: "2004-04-04",
  amount: 400,
  commentAdmin: "ok",
  email: "a@a",
  pct: 20,
};
describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {value:localStorageMock})
    window.localStorage.setItem('user', JSON.stringify({type: 'Employee'}))
   
    const root = document.createElement("div")
    root.setAttribute("id", "root")
    document.body.append(root)
    router()
    window.onNavigate(ROUTES_PATH.NewBill)
  })
  describe("When I am on NewBill Page", () => {
    test("Then the envelope icon in the left menu should be highlighted",async () => {
      
      
      await waitFor(() => screen.getByTestId('icon-mail'))
      const windowIcon = screen.getByTestId('icon-mail')
      expect(windowIcon).toHaveClass('active-icon')
    })

    describe("when a employee uploaded file with valid extension ", () => {
      
      test("then the function handleChangeFile should be called", async () => {
               
        const newBillContainer = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });
  
        const html = NewBillUI();
        document.body.innerHTML = html;

        const testFile = new File(['sample.jpg'], 'sample.jpg', {
          type: 'image/jpg',
        })

        const event = {
          preventDefault: jest.fn(),
          target: {
            value: 'C:\\fakepath\\test.png',
            querySelector: jest.fn().mockReturnValue({
              files: [testFile],
            }),
          },
        };
        
        const inputFile = screen.getByTestId('file');
        expect(inputFile).toBeTruthy();

        const handleChangeFile = jest.fn((e) => newBillContainer.handleChangeFile(e));
        // const handleChangeFile = jest.fn();
        inputFile.addEventListener('change', handleChangeFile(event));
        fireEvent.change(inputFile);

        expect(handleChangeFile).toHaveBeenCalled();
      })
      
      test("then the function hanldesubmit should be called", async () => {
        
        const html = NewBillUI();
        document.body.innerHTML = html;

        const newBillContainer = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });
  
        expect(newBillContainer).toBeTruthy();
        

        const handleSubmit = jest.fn((e) => newBillContainer.handleSubmit(e));
        const form = screen.getByTestId('form-new-bill');
        expect(form).toBeTruthy();
        form.addEventListener('submit', handleSubmit);
        fireEvent.submit(form);

        expect(handleSubmit).toHaveBeenCalled();
      })
      
    })
  })

  //test d'intégration POST
  describe("When I am on NewBill Page and I submit a new bill", () => {
       
      test("Then the new bill should be created", async () => {
        const createBill = jest.fn(mockStore.bills().create);
        const updateBill = jest.fn(mockStore.bills().update);

        const { fileUrl, key } = await createBill();

        expect(createBill).toHaveBeenCalledTimes(1);

        expect(key).toBe("1234");
        expect(fileUrl).toBe("https://localhost:3456/images/test.jpg");

        const newBill = updateBill();

        expect(updateBill).toHaveBeenCalledTimes(1);

        await expect(newBill).resolves.toEqual({
          id: "47qAXb6fIm2zOKkLzMro",
          vat: "80",
          fileUrl:
            "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
          status: "pending",
          type: "Hôtel et logement",
          commentary: "séminaire billed",
          name: "encore",
          fileName: "preview-facture-free-201801-pdf-1.jpg",
          date: "2004-04-04",
          amount: 400,
          commentAdmin: "ok",
          email: "a@a",
          pct: 20,
        });
      })

      test('should fail with 500 message error', async () => { 
        jest.spyOn(mockStore, "bills")
        Object.defineProperty(
            window,
            'localStorage',
            { value: localStorageMock }
        )
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee',
          email: "a@a"
        }))
    mockStore.bills.mockImplementationOnce(() => {
      return {
        create : () =>  {
          return Promise.reject(new Error("Erreur 500"))
        }
      }})
      const html = BillsUI({ error: "Erreur 500" });
      document.body.innerHTML = html;
      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();       
    })

    test("Then the upload fail", () => {
      const html = NewBillUI()
      document.body.innerHTML = html

      const file = screen.getByTestId("file")

      const newBill = new NewBill({
        document,
        onNavigate,
        store: Store,
        localStorage: window.localStorage
      })

      const handleChangeFile = jest.fn(newBill.handleChangeFile)
      file.addEventListener("change", handleChangeFile)
      fireEvent.change(file, {
        target: {
            files: [new File(["image"], "test.pdf", {type: "image/pdf"})]
        }
      })
      expect(file.value).toBe('')
    })
  })
})